import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  updateScratchCardReward,
  deleteScratchCardReward,
} from "@/lib/rewards/scratchCardConfig";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

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
    const { name, description, value, is_enabled } = body;

    if (name !== undefined && (typeof name !== "string" || !name.trim() || name.trim().length > 100)) {
      return NextResponse.json(
        { error: "Reward name cannot exceed 100 characters." },
        { status: 400 }
      );
    }

    if (value !== undefined && (typeof value !== "string" || !value.trim() || value.trim().length > 50)) {
      return NextResponse.json(
        { error: "Reward value cannot exceed 50 characters." },
        { status: 400 }
      );
    }

    if (description !== undefined && description && (typeof description !== "string" || description.trim().length > 250)) {
      return NextResponse.json(
        { error: "Reward description cannot exceed 250 characters." },
        { status: 400 }
      );
    }

    const result = await updateScratchCardReward(user.id, id, {
      ...(name !== undefined && { name: String(name).trim() }),
      ...(description !== undefined && {
        description: description ? String(description).trim() : null,
      }),
      ...(value !== undefined && { value: String(value).trim() }),
      ...(is_enabled !== undefined && { is_enabled: Boolean(is_enabled) }),
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update reward." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      reward: result.reward,
      message: "Reward updated successfully.",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update reward." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
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

    const result = await deleteScratchCardReward(user.id, id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to delete reward." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Reward deleted successfully.",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete reward." },
      { status: 500 }
    );
  }
}

