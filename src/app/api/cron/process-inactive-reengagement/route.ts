import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import {
  findAndScheduleInactiveCustomers,
  processPendingReengagementCampaigns,
} from "@/lib/automations/reengagementScheduler";
import { createClient } from "@/lib/supabase/server";

/**
 * Cron / Server-Side Scheduler endpoint for 30-Day Inactive Customer Re-engagement
 * Can be triggered daily via Vercel Cron or authenticated merchant test-trigger.
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authorization: Require Bearer CRON_SECRET (Vercel Cron / external scheduler)
    // or an authenticated merchant user session (dashboard manual trigger)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET ? process.env.CRON_SECRET.trim() : "";

    let isAuthorized = false;

    if (authHeader && cronSecret) {
      const expectedHeader = `Bearer ${cronSecret}`;
      const authBuffer = Buffer.from(authHeader);
      const expectedBuffer = Buffer.from(expectedHeader);

      if (
        authBuffer.length === expectedBuffer.length &&
        crypto.timingSafeEqual(authBuffer, expectedBuffer)
      ) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          isAuthorized = true;
        }
      } catch {
        // Session check failed
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized cron execution." },
        { status: 401 }
      );
    }

    // Step 1: Scan for eligible inactive customers (>= 30 days) and schedule campaigns
    const scanSummary = await findAndScheduleInactiveCustomers();

    // Step 2: Process pending campaigns and dispatch notifications
    const dispatchSummary = await processPendingReengagementCampaigns();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      scan: scanSummary,
      dispatch: dispatchSummary,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "production"
            ? "Failed to process inactive customer re-engagement"
            : err instanceof Error
            ? err.message
            : "Failed to process inactive customer re-engagement",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}

