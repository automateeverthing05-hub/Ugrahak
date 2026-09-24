import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isWithinNearbyRadius, calculateDistanceMeters } from "@/lib/utils/geolocation";
import { canUseNearbyOffers } from "@/lib/billing/plans";
import { sendMulticastPushNotification } from "@/lib/firebase/admin";
import { rateLimitNearbyCheck } from "@/lib/redis/rateLimiter";
import type { Merchant, Customer, Offer } from "@/lib/types/database";

/**
 * POST /api/shop/nearby-check
 * Evaluates customer GPS location against merchant shop location.
 *
 * Enforces:
 * 1. Strict coordinate bounds (-90 to 90 lat, -180 to 180 lon)
 * 2. Server-side Haversine distance calculation (100–200m radius threshold)
 * 3. Merchant coordinates availability check
 * 4. Merchant plan entitlement check (Growth/Pro)
 * 5. Server-side 24-hour duplicate cooldown protection per customer
 * 6. High-priority FCM push notification dispatch & logging
 * 7. Multi-store discovery support when no slug is specified
 */
export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "anonymous";
    const rateLimit = await rateLimitNearbyCheck(ip);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Too many requests. Please try again in a few moments.",
          nearby: false,
          notificationSent: false,
        },
        { status: 429, headers: { "Retry-After": String(rateLimit.reset) } }
      );
    }

    const body = await request.json();
    const { slug, merchant_id, customer_id, latitude, longitude } = body;

    // 1. Validate geographic coordinates
    const custLat = parseFloat(latitude);
    const custLon = parseFloat(longitude);

    if (
      isNaN(custLat) ||
      isNaN(custLon) ||
      custLat < -90 ||
      custLat > 90 ||
      custLon < -180 ||
      custLon > 180
    ) {
      return NextResponse.json(
        {
          error: "Invalid geographic coordinates received. Latitude must be between -90 and 90, longitude between -180 and 180.",
          nearby: false,
          notificationSent: false,
        },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 2. Multi-Store Radar Discovery (when neither slug nor merchant_id is specified)
    if (!slug && !merchant_id) {
      // 200m bounding box in degrees (~0.003 deg lat, adjusted for lon)
      const dLat = 0.003;
      const cosLat = Math.cos((custLat * Math.PI) / 180);
      const dLon = cosLat !== 0 ? dLat / Math.abs(cosLat) : dLat;

      const minLat = custLat - dLat;
      const maxLat = custLat + dLat;
      const minLon = custLon - dLon;
      const maxLon = custLon + dLon;

      const { data: candidateMerchants, error: mError } = await admin
        .from("merchants")
        .select("id, shop_name, slug, latitude, longitude, plan")
        .gte("latitude", minLat)
        .lte("latitude", maxLat)
        .gte("longitude", minLon)
        .lte("longitude", maxLon);

      if (mError || !candidateMerchants || candidateMerchants.length === 0) {
        return NextResponse.json({
          nearby: false,
          notificationSent: false,
          offers: [],
          message: "No stores currently configured in your area.",
        });
      }

      // Filter eligible candidate merchants by plan and exact Haversine radius
      const eligibleStores: {
        id: string;
        shop_name: string;
        slug: string;
        distanceMeters: number;
      }[] = [];

      for (const m of candidateMerchants) {
        if (m.latitude === null || m.longitude === null) continue;
        if (!canUseNearbyOffers(m.plan)) continue;

        const { isNearby, distanceMeters } = isWithinNearbyRadius(
          custLat,
          custLon,
          m.latitude,
          m.longitude,
          200
        );

        if (isNearby) {
          eligibleStores.push({
            id: m.id,
            shop_name: m.shop_name,
            slug: m.slug,
            distanceMeters,
          });
        }
      }

      if (eligibleStores.length === 0) {
        return NextResponse.json({
          nearby: false,
          notificationSent: false,
          offers: [],
          message: "No active promotional offers found within 200m.",
        });
      }

      // Batch query active offers for all eligible nearby merchants (eliminates N+1 queries)
      const eligibleMerchantIds = eligibleStores.map((s) => s.id);
      const { data: activeOffers } = await admin
        .from("offers")
        .select("merchant_id, title, message, image_url, created_at")
        .in("merchant_id", eligibleMerchantIds)
        .eq("status", "ACTIVE")
        .order("created_at", { ascending: false });

      const offerMap = new Map<string, { title: string; message: string; image_url: string | null }>();
      if (activeOffers) {
        for (const off of activeOffers) {
          if (!offerMap.has(off.merchant_id)) {
            offerMap.set(off.merchant_id, {
              title: off.title,
              message: off.message,
              image_url: off.image_url,
            });
          }
        }
      }

      const nearbyStoresWithOffers = eligibleStores.map((store) => ({
        shop_name: store.shop_name,
        slug: store.slug,
        distanceMeters: store.distanceMeters,
        offer: offerMap.get(store.id) || null,
      }));

      return NextResponse.json({
        nearby: nearbyStoresWithOffers.length > 0,
        notificationSent: false,
        offers: nearbyStoresWithOffers,
        message: `Found ${nearbyStoresWithOffers.length} nearby store(s) within 200m.`,
      });
    }

    // 3. Targeted Single Shop Check
    let query = admin
      .from("merchants")
      .select("id, shop_name, slug, latitude, longitude, plan");

    if (slug) {
      query = query.eq("slug", slug.trim().toLowerCase());
    } else if (merchant_id) {
      query = query.eq("id", merchant_id);
    }

    const { data: merchant, error: merchantError } = await query.maybeSingle<
      Merchant & { latitude: number | null; longitude: number | null; plan: string }
    >();

    if (merchantError || !merchant) {
      return NextResponse.json(
        {
          error: "Shop not found.",
          nearby: false,
          notificationSent: false,
        },
        { status: 404 }
      );
    }

    // 4. Check if Merchant GPS Coordinates are configured
    if (merchant.latitude === null || merchant.longitude === null) {
      return NextResponse.json({
        nearby: false,
        notificationSent: false,
        reason: "MERCHANT_LOCATION_NOT_SET",
        status: "CONFIG_REQUIRED",
        message: "Please set your shop location before enabling Nearby Offers.",
      });
    }

    // 5. Check if Merchant's plan allows Nearby Offers
    if (!canUseNearbyOffers(merchant.plan)) {
      return NextResponse.json({
        nearby: false,
        notificationSent: false,
        reason: "PLAN_RESTRICTION",
        status: "PLAN_FEATURE_UNAVAILABLE",
        message: "Nearby Offers is available on the Growth and Pro plans.",
      });
    }

    // 6. Calculate Haversine Proximity Distance Server-Side (200m target radius)
    const { isNearby, distanceMeters } = isWithinNearbyRadius(
      custLat,
      custLon,
      merchant.latitude,
      merchant.longitude,
      200
    );

    if (!isNearby) {
      return NextResponse.json({
        nearby: false,
        notificationSent: false,
        status: "OUT_OF_RANGE",
        distanceMeters,
        message: "No nearby offer available right now.",
      });
    }

    // 7. If inside radius, verify customer if customer_id provided
    let customer: { id: string; name: string } | null = null;
    if (customer_id && typeof customer_id === "string") {
      const { data: custData, error: custError } = await admin
        .from("customers")
        .select("id, name")
        .eq("id", customer_id)
        .eq("merchant_id", merchant.id)
        .maybeSingle<Customer>();

      if (custError || !custData) {
        return NextResponse.json(
          {
            error: "Customer not registered with this shop.",
            nearby: false,
            notificationSent: false,
          },
          { status: 403 }
        );
      }
      customer = custData;
    }

    // 8. 24-Hour Cooldown Rule Enforcement (server-side per customer)
    if (customer) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recentNearbyLog } = await admin
        .from("nearby_offer_logs")
        .select("id, triggered_at")
        .eq("merchant_id", merchant.id)
        .eq("customer_id", customer.id)
        .gte("triggered_at", twentyFourHoursAgo)
        .order("triggered_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentNearbyLog) {
        return NextResponse.json({
          nearby: true,
          notificationSent: false,
          reason: "24_HOUR_LIMIT",
          status: "COOLDOWN",
          distanceMeters,
          message: "You have already received a nearby offer in the last 24 hours. Please check back tomorrow!",
        });
      }
    }

    // 9. Find Active Offer for this Merchant
    const { data: activeOffer } = await admin
      .from("offers")
      .select("*")
      .eq("merchant_id", merchant.id)
      .eq("status", "ACTIVE")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<Offer>();

    if (!activeOffer) {
      return NextResponse.json({
        nearby: true,
        notificationSent: false,
        reason: "NO_ACTIVE_OFFER",
        status: "NO_ACTIVE_OFFER",
        distanceMeters,
        message: "You're near this shop! No active promotions right now.",
        offer: null,
      });
    }

    // 10. Record Nearby Offer Trigger Log (if customer is registered)
    const now = new Date().toISOString();
    if (customer) {
      await admin.from("nearby_offer_logs").insert({
        merchant_id: merchant.id,
        customer_id: customer.id,
        offer_id: activeOffer.id,
        distance_meters: distanceMeters,
        triggered_at: now,
      });
    }

    // 11. Dispatch FCM Push Notification (if push tokens exist for this customer)
    let notificationSent = false;
    if (customer) {
      const { data: pushTokens } = await admin
        .from("push_tokens")
        .select("token")
        .eq("merchant_id", merchant.id)
        .eq("customer_id", customer.id)
        .eq("is_valid", true);

      if (pushTokens && pushTokens.length > 0) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const tokenList = pushTokens.map((t: { token: string }) => t.token);

        const pushResult = await sendMulticastPushNotification({
          tokens: tokenList,
          title: `Hi ${customer.name}! 🎉`,
          body: `${activeOffer.title}: ${activeOffer.message}`,
          imageUrl: activeOffer.image_url,
          linkUrl: `${baseUrl}/shop/${merchant.slug}`,
          data: {
            offer_id: activeOffer.id,
            merchant_id: merchant.id,
            type: "NEARBY_PROXIMITY_OFFER",
          },
        });

        // Insert notification logs
        for (const token of tokenList) {
          const isSuccessful = pushResult.successfulTokens.includes(token);
          const isInvalid = pushResult.invalidTokens.includes(token);
          const failureObj = pushResult.failedTokens.find((f) => f.token === token);

          await admin.from("notification_logs").insert({
            offer_id: activeOffer.id,
            merchant_id: merchant.id,
            customer_id: customer.id,
            token,
            status: isSuccessful ? "SENT" : isInvalid ? "INVALID_TOKEN" : "FAILED",
            error_message: failureObj ? failureObj.error : isInvalid ? "Token invalid or expired" : null,
            sent_at: now,
          });

          // Mark invalid tokens in push_tokens
          if (isInvalid) {
            await admin
              .from("push_tokens")
              .update({ is_valid: false, updated_at: now })
              .eq("token", token);
          }
        }

        notificationSent = pushResult.totalSent > 0;
      }
    }

    return NextResponse.json({
      nearby: true,
      notificationSent,
      status: "ELIGIBLE",
      distanceMeters,
      message: "You're near this shop! 🎉",
      offer: {
        title: activeOffer.title,
        message: activeOffer.message,
        image_url: activeOffer.image_url,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Internal server error",
        nearby: false,
        notificationSent: false,
      },
      { status: 500 }
    );
  }
}


