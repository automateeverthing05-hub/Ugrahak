import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/observability/logger";
import { IST_TIMEZONE } from "@/lib/utils/formatters";

/**
 * POST /api/merchant/popup-dismiss
 *
 * Records the current IST calendar date as the last popup-shown date for the
 * authenticated merchant, enabling cross-device once-per-day enforcement.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Compute today's IST date string (YYYY-MM-DD)
    const today = new Date().toLocaleDateString("en-CA", { timeZone: IST_TIMEZONE });

    const admin = createAdminClient();
    const { error: updateErr } = await admin
      .from("merchants")
      .update({ last_upgrade_popup_date: today, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (updateErr) {
      logger.warn("Popup dismiss date update failed", {
        operation: "POPUP_DISMISS",
        merchantId: user.id,
      }, updateErr);
      // Non-critical — return success anyway so client local storage still works
    }

    return NextResponse.json({ success: true, lastShownDate: today });
  } catch (err: unknown) {
    logger.error("Popup dismiss endpoint error", { operation: "POPUP_DISMISS" }, err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

