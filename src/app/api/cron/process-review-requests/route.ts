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
    // 1. Authorization: Require Bearer CRON_SECRET with constant-time comparison
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET ? process.env.CRON_SECRET.trim() : "";

    if (!cronSecret) {
      return NextResponse.json(
        { error: "Server misconfiguration: CRON_SECRET is not configured or empty." },
        { status: 500 }
      );
    }

    if (!authHeader) {
      return NextResponse.json(
        { error: "Missing authorization header." },
        { status: 401 }
      );
    }

    const expectedHeader = `Bearer ${cronSecret}`;
    const authBuffer = Buffer.from(authHeader);
    const expectedBuffer = Buffer.from(expectedHeader);

    if (
      authBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(authBuffer, expectedBuffer)
    ) {
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

