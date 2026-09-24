-- ==============================================================================
-- Migration: Scratch Card Rewards Configuration (Step 6)
-- Allows merchants to configure up to 5 custom rewards for first-visit scratch cards.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.scratch_card_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  value TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scratch_rewards_merchant ON public.scratch_card_rewards(merchant_id);
CREATE INDEX IF NOT EXISTS idx_scratch_rewards_enabled ON public.scratch_card_rewards(merchant_id, is_enabled);

ALTER TABLE public.scratch_card_rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Merchants can view own scratch card rewards" ON public.scratch_card_rewards;
CREATE POLICY "Merchants can view own scratch card rewards"
  ON public.scratch_card_rewards FOR SELECT TO authenticated
  USING (auth.uid() = merchant_id);

DROP POLICY IF EXISTS "Merchants can insert own scratch card rewards" ON public.scratch_card_rewards;
CREATE POLICY "Merchants can insert own scratch card rewards"
  ON public.scratch_card_rewards FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = merchant_id);

DROP POLICY IF EXISTS "Merchants can update own scratch card rewards" ON public.scratch_card_rewards;
CREATE POLICY "Merchants can update own scratch card rewards"
  ON public.scratch_card_rewards FOR UPDATE TO authenticated
  USING (auth.uid() = merchant_id)
  WITH CHECK (auth.uid() = merchant_id);

DROP POLICY IF EXISTS "Merchants can delete own scratch card rewards" ON public.scratch_card_rewards;
CREATE POLICY "Merchants can delete own scratch card rewards"
  ON public.scratch_card_rewards FOR DELETE TO authenticated
  USING (auth.uid() = merchant_id);

DROP TRIGGER IF EXISTS trigger_scratch_rewards_updated_at ON public.scratch_card_rewards;
CREATE TRIGGER trigger_scratch_rewards_updated_at
  BEFORE UPDATE ON public.scratch_card_rewards
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

