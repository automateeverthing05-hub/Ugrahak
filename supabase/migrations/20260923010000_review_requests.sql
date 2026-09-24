-- ==============================================================================
-- Migration: Automatic 30-Minute Google Review Requests (Step 7)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  review_url TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_review_req_merchant_customer UNIQUE (merchant_id, customer_id)
);

CREATE INDEX IF NOT EXISTS idx_review_requests_merchant ON public.review_requests(merchant_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_status_time ON public.review_requests(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_review_requests_customer ON public.review_requests(customer_id);

ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Merchants can view own review requests" ON public.review_requests;
CREATE POLICY "Merchants can view own review requests"
  ON public.review_requests FOR SELECT TO authenticated
  USING (auth.uid() = merchant_id);

DROP POLICY IF EXISTS "Merchants can update own review requests" ON public.review_requests;
CREATE POLICY "Merchants can update own review requests"
  ON public.review_requests FOR UPDATE TO authenticated
  USING (auth.uid() = merchant_id)
  WITH CHECK (auth.uid() = merchant_id);

DROP TRIGGER IF EXISTS trigger_review_requests_updated_at ON public.review_requests;
CREATE TRIGGER trigger_review_requests_updated_at
  BEFORE UPDATE ON public.review_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

