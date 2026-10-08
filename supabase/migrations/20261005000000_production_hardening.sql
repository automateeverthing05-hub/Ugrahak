-- ==============================================================================
-- Migration: 20261005000000_production_hardening.sql
-- Ugrahak SaaS - Production Hardening & Multi-Tenant Constraint Enforcement
--
-- 1. Enforces tenant-isolated phone uniqueness:
--    same phone + same merchant = same customer (unique error on duplicate)
--    same phone + different merchant = allowed
--    null/empty phone = allowed (preserves anonymous/scan check-in)
--
-- 2. Adds explicit Row Level Security (RLS) DELETE policy on customers table
--    for authenticated merchants.
--
-- 3. Ensures strict RLS DELETE policy on rewards, visits, and tokens.
-- ==============================================================================

-- 1. Partial Unique Index on (merchant_id, phone)
-- Guarantees that within any single merchant, a given phone number can only exist once.
-- Allows NULL or empty string phone numbers so frictionless scan visits are never blocked.
CREATE UNIQUE INDEX IF NOT EXISTS uq_customers_merchant_phone_unique
ON public.customers (merchant_id, phone)
WHERE phone IS NOT NULL AND phone <> '';

-- 2. Add explicit DELETE policy on customers table for authenticated merchants
DROP POLICY IF EXISTS "Merchants can delete own customers" ON public.customers;
CREATE POLICY "Merchants can delete own customers"
  ON public.customers
  FOR DELETE
  TO authenticated
  USING (auth.uid() = merchant_id);

-- 3. Add explicit DELETE policy on customer_visits table for authenticated merchants
DROP POLICY IF EXISTS "Merchants can delete own visits" ON public.customer_visits;
CREATE POLICY "Merchants can delete own visits"
  ON public.customer_visits
  FOR DELETE
  TO authenticated
  USING (auth.uid() = merchant_id);

-- 4. Add explicit DELETE policy on rewards table for authenticated merchants
DROP POLICY IF EXISTS "Merchants can delete own rewards" ON public.rewards;
CREATE POLICY "Merchants can delete own rewards"
  ON public.rewards
  FOR DELETE
  TO authenticated
  USING (auth.uid() = merchant_id);

-- 5. Add explicit DELETE policy on push_tokens table for authenticated merchants
DROP POLICY IF EXISTS "Merchants can delete own push tokens" ON public.push_tokens;
CREATE POLICY "Merchants can delete own push tokens"
  ON public.push_tokens
  FOR DELETE
  TO authenticated
  USING (auth.uid() = merchant_id);

-- 6. Add composite index for rapid phone lookup within a merchant
CREATE INDEX IF NOT EXISTS idx_customers_merchant_phone_lookup
ON public.customers (merchant_id, phone)
WHERE phone IS NOT NULL;

