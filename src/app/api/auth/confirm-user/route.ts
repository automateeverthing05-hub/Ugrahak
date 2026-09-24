import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidEmail } from "@/lib/utils/validation";
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
        { error: "Too many verification requests. Please wait a minute and try again." },
        { status: 429, headers: { "Retry-After": String(rateLimit.reset) } }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string" || email.length > 255 || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const normalizedEmail = email.trim().toLowerCase();

    // Query user in auth.users
    const { data: usersData, error: listError } = await admin.auth.admin.listUsers();
    if (listError) {
      return NextResponse.json(
        { error: "Unable to complete user verification." },
        { status: 500 }
      );
    }

    const existingUser = usersData.users.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (!existingUser) {
      // Return generic response without confirming user existence to prevent account enumeration
      return NextResponse.json(
        { error: "Unable to verify user account. Please check your credentials." },
        { status: 400 }
      );
    }

    // Update user to confirmed
    const { error: updateError } = await admin.auth.admin.updateUserById(
      existingUser.id,
      {
        email_confirm: true,
      }
    );

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to confirm account status." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      confirmed: true,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

