import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateReferenceCode } from "@/lib/utils/referenceCode";
import { isCustomerLimitReached } from "@/lib/billing/plans";
import { pickRandomFirstVisitReward } from "@/lib/rewards/scratchCardConfig";
import { scheduleReviewRequest } from "@/lib/reviews/reviewScheduler";
import { rateLimitCheckin } from "@/lib/redis/rateLimiter";
import { inngest } from "@/lib/inngest/client";
import type { Customer, Reward, Merchant } from "@/lib/types/database";

/**
 * Public Customer Check-in / Registration Endpoint
 * High-concurrency write-hardened:
 * 1. Creates a unique scan identity (new server-generated UUID) on each check-in
 * 2. Attempts atomic PostgreSQL RPC function (process_customer_checkin)
 * 3. Provides strongly-consistent resilient fallback
 * 4. Enforces plan limits, idempotency, first-visit scratch rewards, and visit tracking
 * 5. Dispatches asynchronous secondary analytics events via Inngest without blocking response
 */
export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "anonymous";
    const rateLimit = await rateLimitCheckin(ip);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many check-in requests. Please wait a moment and try again." },
        { status: 429, headers: { "Retry-After": String(rateLimit.reset) } }
      );
    }

    const body = await request.json();
    const { slug, name } = body;

    // 1. Input Validation
    if (!slug || typeof slug !== "string" || !slug.trim() || slug.trim().length > 100) {
      return NextResponse.json(
        { error: "Shop identifier (slug) is required." },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string" || !name.trim() || name.trim().length > 100) {
      return NextResponse.json(
        { error: "Please enter your name (maximum 100 characters)." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const referenceCode = generateReferenceCode("AG");
    const customerName = name.trim();
    const normalizedSlug = slug.trim().toLowerCase();

    // 2. Primary High-Performance Path: Atomic Database Function (RPC)
    try {
      const { data: rpcResult, error: rpcError } = await (admin as any).rpc(
        "process_customer_checkin",
        {
          p_slug: normalizedSlug,
          p_name: customerName,
          p_reference_code: referenceCode,
        }
      );

      if (!rpcError && rpcResult && typeof rpcResult === "object" && rpcResult.status_code) {
        if (!rpcResult.success) {
          return NextResponse.json(
            { error: rpcResult.error || "Check-in failed." },
            { status: rpcResult.status_code || 400 }
          );
        }

        // Asynchronous non-critical background analytics event via Inngest
        try {
          inngest
            .send({
              name: "merchant/customer.checked_in",
              data: {
                merchantId: rpcResult.customer.merchant_id,
                customerId: rpcResult.customer.id,
                isFirstVisit: true,
                visitCount: 1,
                visitedAt: new Date().toISOString(),
              },
            })
            .catch(() => {});
        } catch {
          // Failure of secondary telemetry never blocks check-in response
        }

        return NextResponse.json({
          success: true,
          isFirstVisit: true,
          visitCount: 1,
          customer: {
            id: rpcResult.customer.id,
            name: rpcResult.customer.name,
          },
          reward: rpcResult.reward,
        });
      }
    } catch {
      // Fall through to resilient TypeScript implementation
    }

    // 3. Resilient TypeScript Fallback Path
    const { data: merchant, error: merchantError } = await admin
      .from("merchants")
      .select("id, shop_name, phone, google_maps_url, slug, plan")
      .eq("slug", normalizedSlug)
      .maybeSingle<Merchant>();

    if (merchantError || !merchant) {
      return NextResponse.json(
        { error: "Shop not found or invalid QR code." },
        { status: 404 }
      );
    }

    const merchantId = merchant.id;

    // Check Plan Customer Limits safely
    let totalCustomersCount: number | null = typeof (merchant as any).customer_count === "number"
      ? (merchant as any).customer_count
      : null;

    if (totalCustomersCount === null) {
      const { count } = await admin
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("merchant_id", merchantId);
      totalCustomersCount = count || 0;
    }

    const planCheck = isCustomerLimitReached(totalCustomersCount, merchant.plan);
    if (planCheck.isReached) {
      return NextResponse.json(
        {
          error: `Store customer limit reached (${planCheck.current} / ${planCheck.limit}). Please notify the store owner to upgrade their Ugrahak plan.`,
        },
        { status: 403 }
      );
    }

    // Create a new Customer record with a new server-generated UUID on every scan
    const now = new Date().toISOString();

    const { data: newCustomer, error: createCustError } = await admin
      .from("customers")
      .insert({
        merchant_id: merchantId,
        name: customerName,
        phone: null,
        visit_count: 1,
        first_visit_at: now,
        last_visit_at: now,
      })
      .select()
      .single<Customer>();

    if (createCustError || !newCustomer) {
      return NextResponse.json(
        { error: "Failed to record your visit. Please try again." },
        { status: 500 }
      );
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // 30-day validity

    // Concurrently pick reward, record visit history, and schedule review request
    const [selectedOption] = await Promise.all([
      pickRandomFirstVisitReward(merchantId, merchant.shop_name),
      admin.from("customer_visits").insert({
        merchant_id: merchantId,
        customer_id: newCustomer.id,
        visit_type: "FIRST_VISIT",
        visited_at: now,
      }),
      merchant.google_maps_url
        ? scheduleReviewRequest(
            merchantId,
            newCustomer.id,
            merchant.google_maps_url,
            now
          )
        : Promise.resolve({ success: true }),
    ]);

    const { data: newReward } = await admin
      .from("rewards")
      .insert({
        merchant_id: merchantId,
        customer_id: newCustomer.id,
        reward_type: "FIRST_VISIT",
        title: selectedOption.title,
        description: selectedOption.description,
        discount_value: selectedOption.discount_value,
        status: "ACTIVE",
        reference_code: referenceCode,
        issued_at: now,
        expires_at: expiryDate.toISOString(),
      })
      .select()
      .single<Reward>();

    // Secondary analytics
    try {
      inngest
        .send({
          name: "merchant/customer.checked_in",
          data: {
            merchantId,
            customerId: newCustomer.id,
            isFirstVisit: true,
            visitCount: 1,
            visitedAt: now,
          },
        })
        .catch(() => {});
    } catch {
      // Safe catch
    }

    return NextResponse.json({
      success: true,
      isFirstVisit: true,
      visitCount: 1,
      customer: {
        id: newCustomer.id,
        name: newCustomer.name,
      },
      reward: newReward
        ? {
            title: newReward.title,
            description: newReward.description,
            reference_code: newReward.reference_code,
            expires_at: newReward.expires_at,
            status: newReward.status,
          }
        : null,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error." },
      { status: 500 }
    );
  }
}
