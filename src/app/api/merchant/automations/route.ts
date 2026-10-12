import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMerchantReengagementCampaigns } from "@/lib/automations/reengagementScheduler";
import type { Merchant, Offer } from "@/lib/types/database";

/**
 * GET: Retrieve merchant automation settings, available active offers, and campaign history
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const admin = createAdminClient();

    // 1. Fetch merchant automation settings
    const { data: merchant, error: merchantErr } = await admin
      .from("merchants")
      .select("id, shop_name, google_maps_url, is_review_request_enabled, is_reengagement_enabled, reengagement_offer_id, reengagement_message_template, plan")
      .eq("id", user.id)
      .maybeSingle<Merchant>();

    if (merchantErr || !merchant) {
      return NextResponse.json({ error: "Merchant not found." }, { status: 404 });
    }

    // 2. Fetch active offers belonging to this merchant for selection
    const { data: offers } = await admin
      .from("offers")
      .select("id, title, message, status, end_at, image_url")
      .eq("merchant_id", user.id)
      .eq("status", "ACTIVE")
      .order("created_at", { ascending: false });

    // 3. Fetch recent re-engagement campaigns
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "30", 10) || 30;
    const campaigns = await getMerchantReengagementCampaigns(user.id, limit);

    return NextResponse.json({
      success: true,
      settings: {
        is_review_request_enabled: merchant.is_review_request_enabled ?? true,
        google_maps_url: merchant.google_maps_url,
        is_reengagement_enabled: merchant.is_reengagement_enabled ?? false,
        reengagement_offer_id: merchant.reengagement_offer_id,
        reengagement_message_template: merchant.reengagement_message_template,
      },
      offers: offers || [],
      campaigns,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load automations." },
      { status: 500 }
    );
  }
}

/**
 * POST: Update merchant automation settings
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const body = await request.json();
    const {
      is_review_request_enabled,
      is_reengagement_enabled,
      reengagement_offer_id,
      reengagement_message_template,
    } = body;

    const admin = createAdminClient();

    // Verify offer belongs to this merchant if provided
    if (reengagement_offer_id) {
      const { data: offer } = await admin
        .from("offers")
        .select("id")
        .eq("id", reengagement_offer_id)
        .eq("merchant_id", user.id)
        .maybeSingle<Offer>();

      if (!offer) {
        return NextResponse.json(
          { error: "Selected offer not found or unauthorized." },
          { status: 400 }
        );
      }
    }

    const updates: Partial<Merchant> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof is_review_request_enabled === "boolean") {
      updates.is_review_request_enabled = is_review_request_enabled;
    }

    if (typeof is_reengagement_enabled === "boolean") {
      updates.is_reengagement_enabled = is_reengagement_enabled;
    }

    if (reengagement_offer_id !== undefined) {
      updates.reengagement_offer_id = reengagement_offer_id || null;
    }

    if (reengagement_message_template !== undefined) {
      updates.reengagement_message_template =
        typeof reengagement_message_template === "string"
          ? reengagement_message_template.trim()
          : null;
    }

    const { data: updated, error: updateErr } = await admin
      .from("merchants")
      .update(updates)
      .eq("id", user.id)
      .select("id, is_review_request_enabled, is_reengagement_enabled, reengagement_offer_id, reengagement_message_template")
      .single();

    if (updateErr) {
      return NextResponse.json(
        { error: `Failed to update automation settings: ${updateErr.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: updated,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save settings." },
      { status: 500 }
    );
  }
}

