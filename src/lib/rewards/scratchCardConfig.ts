import { createAdminClient } from "@/lib/supabase/admin";
import type { ScratchCardReward } from "@/lib/types/database";

export const MAX_SCRATCH_REWARDS_PER_MERCHANT = 5;

export const DEFAULT_FIRST_VISIT_REWARD = {
  title: "Flat 10% Off On Your Purchase",
  description: "Welcome reward for your first visit! Show this code at the billing counter.",
  discount_value: "10%",
};

/**
 * Fetch all scratch card rewards for a specific merchant from Supabase (Stateless).
 */
export async function getScratchCardRewards(
  merchantId: string
): Promise<ScratchCardReward[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("scratch_card_rewards")
      .select("*")
      .eq("merchant_id", merchantId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      return data as ScratchCardReward[];
    }
  } catch {
    // Graceful fallback to empty
  }

  return [];
}

/**
 * Create a new scratch card reward for a merchant (Enforcing maximum 5 rewards).
 */
export async function createScratchCardReward(
  merchantId: string,
  rewardData: {
    name: string;
    description?: string | null;
    value: string;
    is_enabled?: boolean;
  }
): Promise<{ success: boolean; reward?: ScratchCardReward; error?: string }> {
  const existing = await getScratchCardRewards(merchantId);
  if (existing.length >= MAX_SCRATCH_REWARDS_PER_MERCHANT) {
    return {
      success: false,
      error: `Maximum limit reached. You can create up to ${MAX_SCRATCH_REWARDS_PER_MERCHANT} rewards for your scratch card.`,
    };
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("scratch_card_rewards")
      .insert({
        merchant_id: merchantId,
        name: rewardData.name.trim(),
        description: rewardData.description?.trim() || null,
        value: rewardData.value.trim(),
        is_enabled: rewardData.is_enabled !== false,
      })
      .select()
      .single<ScratchCardReward>();

    if (!error && data) {
      return { success: true, reward: data };
    }
    return { success: false, error: error?.message || "Failed to create reward." };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Update an existing scratch card reward for a merchant.
 */
export async function updateScratchCardReward(
  merchantId: string,
  rewardId: string,
  updates: {
    name?: string;
    description?: string | null;
    value?: string;
    is_enabled?: boolean;
  }
): Promise<{ success: boolean; reward?: ScratchCardReward; error?: string }> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("scratch_card_rewards")
      .update({
        ...(updates.name !== undefined && { name: updates.name.trim() }),
        ...(updates.description !== undefined && {
          description: updates.description ? updates.description.trim() : null,
        }),
        ...(updates.value !== undefined && { value: updates.value.trim() }),
        ...(updates.is_enabled !== undefined && { is_enabled: updates.is_enabled }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", rewardId)
      .eq("merchant_id", merchantId)
      .select()
      .single<ScratchCardReward>();

    if (!error && data) {
      return { success: true, reward: data };
    }
    return { success: false, error: error?.message || "Failed to update reward." };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Delete a scratch card reward for a merchant.
 */
export async function deleteScratchCardReward(
  merchantId: string,
  rewardId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("scratch_card_rewards")
      .delete()
      .eq("id", rewardId)
      .eq("merchant_id", merchantId);

    if (!error) {
      return { success: true };
    }
    return { success: false, error: error.message };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Server-Side Random First Visit Reward Selector:
 * 1. Queries all enabled scratch-card rewards for the merchant from Supabase.
 * 2. If configured rewards exist, randomly picks ONE server-side.
 * 3. If none configured, falls back to the default Flat 10% Off reward.
 */
export async function pickRandomFirstVisitReward(
  merchantId: string,
  shopName: string
): Promise<{
  title: string;
  description: string;
  discount_value: string;
}> {
  const allRewards = await getScratchCardRewards(merchantId);
  const enabledRewards = allRewards.filter((r) => r.is_enabled);

  if (enabledRewards.length > 0) {
    const randomIndex = Math.floor(Math.random() * enabledRewards.length);
    const selected = enabledRewards[randomIndex];
    return {
      title: selected.name,
      description:
        selected.description ||
        `Special welcome reward from ${shopName}! Show this code at cashier.`,
      discount_value: selected.value,
    };
  }

  // Fallback default
  return {
    ...DEFAULT_FIRST_VISIT_REWARD,
    description: `Welcome reward from ${shopName}! Show this code at the billing counter.`,
  };
}
