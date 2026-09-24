import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidEmail, isValidPassword, isValidPhone, isValidGoogleMapsUrl } from "@/lib/utils/validation";
import { generateSlug } from "@/lib/utils/slugify";
import { normalizePhone } from "@/lib/utils/referenceCode";
import { rateLimitAuth } from "@/lib/redis/rateLimiter";

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "anonymous";
    const rateLimit = await rateLimitAuth(ip);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many signup attempts. Please wait a minute and try again." },
        { status: 429, headers: { "Retry-After": String(rateLimit.reset) } }
      );
    }

    const body = await request.json();
    const { owner_name, shop_name, phone, email, google_maps_url, password } = body;

    // 1. Validations
    if (!owner_name || typeof owner_name !== "string" || !owner_name.trim() || owner_name.trim().length > 100) {
      return NextResponse.json(
        { error: "Please enter your name (maximum 100 characters)." },
        { status: 400 }
      );
    }

    if (!shop_name || typeof shop_name !== "string" || !shop_name.trim() || shop_name.trim().length > 100) {
      return NextResponse.json(
        { error: "Please enter your shop or business name (maximum 100 characters)." },
        { status: 400 }
      );
    }

    const cleanPhone = normalizePhone(phone || "");
    if (!cleanPhone || !isValidPhone(cleanPhone)) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || email.length > 255 || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length > 72) {
      return NextResponse.json(
        { error: "Password must be between 6 and 72 characters." },
        { status: 400 }
      );
    }

    const passCheck = isValidPassword(password);
    if (!passCheck.valid) {
      return NextResponse.json(
        { error: passCheck.message || "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    if (google_maps_url && typeof google_maps_url === "string" && google_maps_url.trim()) {
      if (google_maps_url.trim().length > 1000 || !isValidGoogleMapsUrl(google_maps_url.trim())) {
        return NextResponse.json(
          { error: "Please enter a valid Google Maps review link." },
          { status: 400 }
        );
      }
    }

    const admin = createAdminClient();
    const normalizedEmail = email.trim().toLowerCase();

    // 2. Create merchant user with instant email confirmation (email_confirm: true)
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        role: "merchant",
        owner_name: owner_name.trim(),
        shop_name: shop_name.trim(),
        phone: cleanPhone,
      },
    });

    if (authError) {
      if (
        authError.message.toLowerCase().includes("already registered") ||
        authError.message.toLowerCase().includes("already in use") ||
        authError.message.toLowerCase().includes("unique constraint")
      ) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please log in." },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: authError.message || "Failed to create merchant account." },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Failed to initialize merchant user account." },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    // 3. Generate unique slug for shop
    const baseSlug = generateSlug(shop_name.trim()) || "shop";
    let finalSlug = baseSlug;

    // Check if slug already exists
    const { data: existingSlug } = await admin
      .from("merchants")
      .select("id")
      .eq("slug", finalSlug)
      .maybeSingle();

    if (existingSlug) {
      // Append short random suffix
      finalSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const now = new Date().toISOString();
    const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // 4. Create merchant profile in public.merchants
    const { error: profileError } = await admin.from("merchants").upsert(
      {
        id: userId,
        shop_name: shop_name.trim(),
        owner_name: owner_name.trim(),
        phone: cleanPhone,
        google_maps_url: google_maps_url?.trim() || null,
        slug: finalSlug,
        plan: "TRIAL",
        subscription_status: "ACTIVE",
        trial_started_at: now,
        trial_ends_at: trialEnd,
        created_at: now,
        updated_at: now,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      console.error("Merchant profile creation notice:", profileError);
    }

    // 5. Seed default first-visit scratch card reward for immediate QR readiness
    try {
      await admin.from("scratch_card_rewards").insert([
        {
          merchant_id: userId,
          name: "Flat 10% Off On Your Purchase",
          description: "Welcome reward for your first visit! Show this code at the billing counter.",
          value: "10%",
          is_enabled: true,
        },
      ]);
    } catch (seedErr) {
      // Non-blocking
      console.warn("Default scratch reward seed notice:", seedErr);
    }

    return NextResponse.json({
      success: true,
      userId: userId,
      email: normalizedEmail,
      slug: finalSlug,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
