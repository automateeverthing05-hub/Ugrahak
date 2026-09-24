import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitRedeem } from "@/lib/redis/rateLimiter";
import type { Reward, Customer } from "@/lib/types/database";

/**
 * POST /api/merchant/redeem
 * Validates and redeems a reward reference code for the logged-in merchant.
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
        { error: "Unauthorized. Please sign in as a merchant." },
        { status: 401 }
      );
    }

    const rateLimit = await rateLimitRedeem(user.id);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many redemption requests. Please wait a moment." },
        { status: 429, headers: { "Retry-After": String(rateLimit.reset) } }
      );
    }

    const body = await request.json();
    const { reference_code } = body;

    if (!reference_code || typeof reference_code !== "string" || !reference_code.trim()) {
      return NextResponse.json(
        { error: "Please enter a valid reward reference code." },
        { status: 400 }
      );
    }

    const cleanCode = reference_code.trim().toUpperCase();
    const admin = createAdminClient();

    // 1. Look up the reward by reference_code
    const { data: reward, error: fetchError } = await admin
      .from("rewards")
      .select("*")
      .eq("reference_code", cleanCode)
      .maybeSingle<Reward>();

    if (fetchError || !reward) {
      return NextResponse.json(
        { error: `Invalid reference code "${cleanCode}". No such reward found.` },
        { status: 404 }
      );
    }

    // 2. Strict multi-tenant security: Ensure the reward belongs to the logged-in merchant
    if (reward.merchant_id !== user.id) {
      return NextResponse.json(
        {
          error: "This reward reference code was issued by another merchant and cannot be redeemed here.",
        },
        { status: 403 }
      );
    }

    // 3. Check if already redeemed
    if (reward.status === "REDEEMED") {
      const redeemedDate = reward.redeemed_at
        ? new Date(reward.redeemed_at).toLocaleString()
        : "previously";
      return NextResponse.json(
        {
          error: `This reward was already redeemed on ${redeemedDate}.`,
        },
        { status: 400 }
      );
    }

    // 4. Check if expired
    if (reward.expires_at && new Date(reward.expires_at).getTime() < Date.now()) {
      // Mark as EXPIRED if not already
      await admin
        .from("rewards")
        .update({ status: "EXPIRED" })
        .eq("id", reward.id);

      return NextResponse.json(
        {
          error: "This reward has expired and can no longer be redeemed.",
        },
        { status: 400 }
      );
    }

    // 5. Fetch Customer details for display
    const { data: customer } = await admin
      .from("customers")
      .select("id, name, phone")
      .eq("id", reward.customer_id)
      .maybeSingle<Customer>();

    // 6. Perform atomic update to REDEEMED status
    const now = new Date().toISOString();
    const { data: updatedReward, error: updateError } = await admin
      .from("rewards")
      .update({
        status: "REDEEMED",
        redeemed_at: now,
      })
      .eq("id", reward.id)
      .eq("status", "ACTIVE") // Concurrency safety
      .select()
      .single<Reward>();

    if (updateError || !updatedReward) {
      return NextResponse.json(
        { error: "Failed to redeem reward. It may have just been redeemed." },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Reward redeemed successfully!",
      reward: {
        id: updatedReward.id,
        title: updatedReward.title,
        description: updatedReward.description,
        discount_value: updatedReward.discount_value,
        reference_code: updatedReward.reference_code,
        redeemed_at: updatedReward.redeemed_at,
      },
      customer: customer
        ? {
            name: customer.name,
            phone: customer.phone,
          }
        : null,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

