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
    const { email, password } = body;

    if (!email || typeof email !== "string" || email.length > 255 || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length > 72) {
      return NextResponse.json(
        { error: "Password credentials are required to verify account." },
        { status: 400 }
      );
    }

    // Use a separate throwaway client with session persistence disabled to verify password
    const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    const throwawayClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const normalizedEmail = email.trim().toLowerCase();

    const { error: credError } = await throwawayClient.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    // Check if error code indicates email unconfirmed; if credentials are wrong, return generic unauthorized
    const isUnconfirmed = credError && (
      ("code" in credError && (credError as { code?: string }).code === "email_not_confirmed") ||
      credError.message.toLowerCase().includes("email not confirmed")
    );

    if (!isUnconfirmed) {
      return NextResponse.json(
        { error: "Invalid email or password credentials." },
        { status: 401 }
      );
    }

    const admin = createAdminClient();

    // Direct O(1) user lookup in auth.users without pagination or scanning
    const { data: linkData, error: lookupError } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: normalizedEmail,
    });

    const existingUserId = linkData?.user?.id;

    if (lookupError || !existingUserId) {
      return NextResponse.json(
        { error: "Invalid email or password credentials." },
        { status: 401 }
      );
    }

    // Update user to confirmed
    const { error: updateError } = await admin.auth.admin.updateUserById(
      existingUserId,
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

