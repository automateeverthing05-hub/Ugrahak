import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getScratchCardRewards,
  createScratchCardReward,
  MAX_SCRATCH_REWARDS_PER_MERCHANT,
} from "@/lib/rewards/scratchCardConfig";

export async function GET() {
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

    const rewards = await getScratchCardRewards(user.id);
    return NextResponse.json({
      success: true,
      rewards,
      maxAllowed: MAX_SCRATCH_REWARDS_PER_MERCHANT,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch scratch rewards." },
      { status: 500 }
    );
  }
}

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
    const { name, description, value, is_enabled } = body;

    if (!name || typeof name !== "string" || !name.trim() || name.trim().length > 100) {
      return NextResponse.json(
        { error: "Reward name is required (maximum 100 characters)." },
        { status: 400 }
      );
    }

    if (!value || typeof value !== "string" || !value.trim() || value.trim().length > 50) {
      return NextResponse.json(
        { error: "Reward value is required (maximum 50 characters, e.g. 10%, ₹50)." },
        { status: 400 }
      );
    }

    if (description && (typeof description !== "string" || description.trim().length > 250)) {
      return NextResponse.json(
        { error: "Reward description cannot exceed 250 characters." },
        { status: 400 }
      );
    }

    const result = await createScratchCardReward(user.id, {
      name: name.trim(),
      description: description ? String(description).trim() : null,
      value: value.trim(),
      is_enabled: is_enabled !== false,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to create reward." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      reward: result.reward,
      message: "Reward created successfully.",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save reward." },
      { status: 500 }
    );
  }
}

