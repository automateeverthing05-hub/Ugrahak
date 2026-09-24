import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Offer, OfferUpdate } from "@/lib/types/database";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET: Fetch single offer and its delivery logs
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
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

    const { data: offer, error: dbError } = await supabase
      .from("offers")
      .select("*")
      .eq("id", id)
      .eq("merchant_id", user.id)
      .maybeSingle<Offer>();

    if (dbError || !offer) {
      return NextResponse.json(
        { error: "Offer not found." },
        { status: 404 }
      );
    }

    // Fetch delivery logs for this offer
    const { data: logs } = await supabase
      .from("notification_logs")
      .select("*")
      .eq("offer_id", id)
      .eq("merchant_id", user.id)
      .order("sent_at", { ascending: false });

    return NextResponse.json({
      offer,
      logs: logs || [],
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT: Update offer
 */
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
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
    const { title, message, image_url, status, start_at, end_at } = body;

    const admin = createAdminClient();

    // Verify ownership
    const { data: existingOffer } = await admin
      .from("offers")
      .select("id")
      .eq("id", id)
      .eq("merchant_id", user.id)
      .maybeSingle();

    if (!existingOffer) {
      return NextResponse.json(
        { error: "Offer not found or unauthorized." },
        { status: 404 }
      );
    }

    const payload: OfferUpdate = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim() || title.trim().length > 150) {
        return NextResponse.json(
          { error: "Offer title cannot exceed 150 characters." },
          { status: 400 }
        );
      }
      payload.title = title.trim();
    }

    if (message !== undefined) {
      if (typeof message !== "string" || !message.trim() || message.trim().length > 1000) {
        return NextResponse.json(
          { error: "Offer message cannot exceed 1000 characters." },
          { status: 400 }
        );
      }
      payload.message = message.trim();
    }

    if (image_url !== undefined) {
      if (image_url && typeof image_url === "string" && image_url.trim()) {
        const trimmedUrl = image_url.trim();
        if (trimmedUrl.length > 2000 || (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://"))) {
          return NextResponse.json(
            { error: "Image URL must be a valid http or https link under 2000 characters." },
            { status: 400 }
          );
        }
        payload.image_url = trimmedUrl;
      } else {
        payload.image_url = null;
      }
    }

    if (status && ["ACTIVE", "INACTIVE", "ARCHIVED"].includes(status)) payload.status = status;
    if (start_at !== undefined) payload.start_at = start_at ? new Date(start_at).toISOString() : null;
    if (end_at !== undefined) payload.end_at = end_at ? new Date(end_at).toISOString() : null;

    const { data: updatedOffer, error: updateError } = await admin
      .from("offers")
      .update(payload)
      .eq("id", id)
      .eq("merchant_id", user.id)
      .select()
      .single<Offer>();

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update offer: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      offer: updatedOffer,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Delete offer
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
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

    const admin = createAdminClient();
    const { error: deleteError } = await admin
      .from("offers")
      .delete()
      .eq("id", id)
      .eq("merchant_id", user.id);

    if (deleteError) {
      return NextResponse.json(
        { error: `Failed to delete offer: ${deleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

