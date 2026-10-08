import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { processPendingReviewRequests } from "@/lib/reviews/reviewScheduler";
import { createClient } from "@/lib/supabase/server";

/**
 * Cron / Server-Side Scheduler endpoint for Automatic Google Review Requests
 * Triggers every minute (via Vercel Cron or secure manual trigger) to process pending requests.
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authorization: Allow Vercel Cron (header 'x-vercel-cron') or CRON_SECRET or authenticated merchant (in dev)
    const authHeader = request.headers.get("authorization");
    const isVercelCron = Boolean(request.headers.get("x-vercel-cron"));
    const cronSecret = process.env.CRON_SECRET;

    let isAuthorized = isVercelCron;

    if (cronSecret && authHeader) {
      const expectedHeader = `Bearer ${cronSecret}`;
      // Constant-length / timing safe check if lengths match
      if (
        authHeader.length === expectedHeader.length &&
        crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expectedHeader))
      ) {
        isAuthorized = true;
      }
    }

    // In non-production environments, also allow authenticated merchants to test-trigger the scheduler
    if (!isAuthorized && process.env.NODE_ENV !== "production") {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          isAuthorized = true;
        }
      } catch {
        // Ignore
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized cron execution." },
        { status: 401 }
      );
    }

    // 2. Process all pending requests whose scheduled_at <= NOW()
    const summary = await processPendingReviewRequests();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "production"
            ? "Failed to process review requests"
            : err instanceof Error
            ? err.message
            : "Failed to process review requests",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}

