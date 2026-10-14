import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Offer, OfferInsert } from "@/lib/types/database";

import { logger } from "@/lib/observability/logger";
import { offerCreateOrUpdateSchema, formatZodError } from "@/lib/validation/schemas";

/**
 * GET: List offers for the logged-in merchant with pagination support
 */
export async function GET(request: NextRequest) {
  const start = Date.now();
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

    const { searchParams } = new URL(request.url);
    const rawLimit = searchParams.get("limit");
    const rawPage = searchParams.get("page");

    let query = supabase
      .from("offers")
      .select("*", { count: "exact" })
      .eq("merchant_id", user.id)
      .order("created_at", { ascending: false });

    if (rawLimit) {
      const limit = Math.min(Math.max(1, parseInt(rawLimit, 10) || 25), 100);
      const page = Math.max(1, parseInt(rawPage || "1", 10) || 1);
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);
    }

    const { data: offers, count, error: dbError } = await query;

    if (dbError) {
      logger.error("Failed to fetch merchant offers", {
        operation: "GET_OFFERS",
        merchantId: user.id,
        durationMs: Date.now() - start,
      }, dbError);

      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      offers: offers || [],
      totalCount: count || offers?.length || 0,
    });
  } catch (err: unknown) {
    logger.error("Unexpected error fetching offers", {
      operation: "GET_OFFERS",
      durationMs: Date.now() - start,
    }, err);

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new offer for the logged-in merchant
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
    const parseResult = offerCreateOrUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error).error },
        { status: 400 }
      );
    }

    const { title, message, image_url, status, start_at, end_at, start_date, end_date } = parseResult.data;
    const finalStartAt = start_at || start_date;
    const finalEndAt = end_at || end_date;

    let sanitizedImageUrl: string | null = null;
    if (image_url && typeof image_url === "string" && image_url.trim()) {
      const trimmedUrl = image_url.trim();
      if (trimmedUrl.length > 2000 || (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://"))) {
        return NextResponse.json(
          { error: "Image URL must be a valid http or https link under 2000 characters." },
          { status: 400 }
        );
      }
      sanitizedImageUrl = trimmedUrl;
    }

    const admin = createAdminClient();
    const payload: OfferInsert = {
      merchant_id: user.id, // Strictly derived from session
      title: title.trim(),
      message: message.trim(),
      image_url: sanitizedImageUrl,
      status: ["ACTIVE", "INACTIVE", "ARCHIVED"].includes(status) ? status : "ACTIVE",
      start_at: finalStartAt ? new Date(finalStartAt).toISOString() : null,
      end_at: finalEndAt ? new Date(finalEndAt).toISOString() : null,
    };

    const { data: newOffer, error: insertError } = await admin
      .from("offers")
      .insert(payload)
      .select()
      .single<Offer>();

    if (insertError) {
      return NextResponse.json(
        { error: `Failed to create offer: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      offer: newOffer,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

