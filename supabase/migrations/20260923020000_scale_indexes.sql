-- ==============================================================================
-- Migration: 20260923020000_scale_indexes.sql
-- Goal: Add composite indexes for 100k merchant high-volume query scaling
-- Safe, additive-only migration. Zero drops, zero deletes.
-- ==============================================================================

-- 1. Customers high-frequency filtering indexes
CREATE INDEX IF NOT EXISTS idx_customers_merchant_visits 
  ON public.customers(merchant_id, visit_count);

CREATE INDEX IF NOT EXISTS idx_customers_merchant_last_visit 
  ON public.customers(merchant_id, last_visit_at DESC);

-- 2. Customer visits fast lookup
CREATE INDEX IF NOT EXISTS idx_customer_visits_customer_time 
  ON public.customer_visits(customer_id, visited_at DESC);

-- 3. Rewards composite indexes for instant status checking & merchant lists
CREATE INDEX IF NOT EXISTS idx_rewards_merchant_created 
  ON public.rewards(merchant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rewards_customer_status 
  ON public.rewards(customer_id, status);

-- 4. Push Tokens composite lookup for fast multicast token retrieval
CREATE INDEX IF NOT EXISTS idx_push_tokens_customer_valid 
  ON public.push_tokens(customer_id, is_valid);

CREATE INDEX IF NOT EXISTS idx_push_tokens_merchant_customer_valid 
  ON public.push_tokens(merchant_id, customer_id, is_valid);

-- 5. Notification Logs customer audit & offer status tracking
CREATE INDEX IF NOT EXISTS idx_notification_logs_customer_time 
  ON public.notification_logs(customer_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_logs_offer_status 
  ON public.notification_logs(offer_id, status);

-- 6. Review Requests merchant lookup
CREATE INDEX IF NOT EXISTS idx_review_requests_merchant_customer 
  ON public.review_requests(merchant_id, customer_id);

