import { NextResponse, type NextRequest } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateSlug, sanitizeSlug } from "@/lib/utils/slugify";
import { isValidPhone, isValidGoogleMapsUrl } from "@/lib/utils/validation";
import type { Merchant, MerchantInsert } from "@/lib/types/database";

/**
 * GET: Fetch the current authenticated merchant's profile
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // Query merchant profile for this user only
    const { data: merchant, error: dbError } = await supabase
      .from("merchants")
      .select("*")
      .eq("id", user.id)
      .maybeSingle<Merchant>();

    if (dbError) {
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ merchant: merchant || null });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * POST: Create or update merchant profile
 * Enforces server-side authorization: user.id is strictly derived from auth token
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      shop_name,
      owner_name,
      phone,
      google_maps_url,
      slug,
      latitude,
      longitude,
    } = body;

    // 1. Validation
    if (!shop_name || typeof shop_name !== "string" || !shop_name.trim() || shop_name.trim().length > 100) {
      return NextResponse.json(
        { error: "Shop name is required (maximum 100 characters)." },
        { status: 400 }
      );
    }

    if (owner_name && (typeof owner_name !== "string" || owner_name.trim().length > 100)) {
      return NextResponse.json(
        { error: "Owner name cannot exceed 100 characters." },
        { status: 400 }
      );
    }

    if (!phone || typeof phone !== "string" || phone.length > 15 || !isValidPhone(phone)) {
      return NextResponse.json(
        { error: "A valid phone number is required." },
        { status: 400 }
      );
    }

    const rawSlug = slug && typeof slug === "string" ? slug : generateSlug(shop_name);
    const finalSlug = sanitizeSlug(rawSlug);

    if (!finalSlug || finalSlug.length > 100) {
      return NextResponse.json(
        { error: "Invalid shop slug generated." },
        { status: 400 }
      );
    }

    if (google_maps_url && (typeof google_maps_url !== "string" || google_maps_url.length > 1000 || !isValidGoogleMapsUrl(google_maps_url))) {
      return NextResponse.json(
        { error: "Invalid Google Maps URL format." },
        { status: 400 }
      );
    }

    // 2. Multi-tenant Slug Uniqueness Check
    const admin = createAdminClient();
    const { data: existingSlugMerchant } = await admin
      .from("merchants")
      .select("id, slug")
      .eq("slug", finalSlug)
      .maybeSingle<{ id: string; slug: string }>();

    if (existingSlugMerchant && existingSlugMerchant.id !== user.id) {
      return NextResponse.json(
        {
          error: `Shop URL slug "${finalSlug}" is already taken. Please choose a different slug.`,
        },
        { status: 400 }
      );
    }

    let parsedLat: number | null = null;
    let parsedLon: number | null = null;
    if (latitude !== undefined && latitude !== null && latitude !== "") {
      const latVal = parseFloat(latitude);
      if (!isNaN(latVal) && latVal >= -90 && latVal <= 90) {
        parsedLat = latVal;
      }
    }
    if (longitude !== undefined && longitude !== null && longitude !== "") {
      const lonVal = parseFloat(longitude);
      if (!isNaN(lonVal) && lonVal >= -180 && lonVal <= 180) {
        parsedLon = lonVal;
      }
    }

    // 3. Upsert merchant profile enforcing user.id
    const payload = {
      id: user.id, // Strictly derived from authenticated session
      shop_name: shop_name.trim(),
      owner_name: owner_name?.trim() || null,
      phone: phone.trim(),
      google_maps_url: google_maps_url?.trim() || null,
      slug: finalSlug,
      latitude: parsedLat,
      longitude: parsedLon,
      updated_at: new Date().toISOString(),
    };

    const { data: savedMerchant, error: saveError } = await admin
      .from("merchants")
      .upsert(payload, { onConflict: "id" })
      .select()
      .single<Merchant>();

    if (saveError) {
      return NextResponse.json(
        { error: `Failed to save profile: ${saveError.message}` },
        { status: 500 }
      );
    }

    try {
      revalidateTag("merchant-profile");
      revalidatePath(`/shop/${savedMerchant.slug}`);
    } catch {
      // Invalidation best-effort during static generation or background contexts
    }

    return NextResponse.json({
      success: true,
      merchant: savedMerchant,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
