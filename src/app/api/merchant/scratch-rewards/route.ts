import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getScratchCardRewards,
  createScratchCardReward,
  MAX_SCRATCH_REWARDS_PER_MERCHANT,
} from "@/lib/rewards/scratchCardConfig";
import { scratchRewardCreateOrUpdateSchema, formatZodError } from "@/lib/validation/schemas";

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
    const parseResult = scratchRewardCreateOrUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error).error },
        { status: 400 }
      );
    }

    const { name, description, value, is_enabled } = parseResult.data;

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

