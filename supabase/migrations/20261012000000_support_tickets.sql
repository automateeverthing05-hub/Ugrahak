-- Migration: Support tickets table for storing and auditing user inquiries
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    business_name TEXT,
    contact_info TEXT NOT NULL,
    topic TEXT NOT NULL DEFAULT 'General',
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN',
    delivery_status TEXT NOT NULL DEFAULT 'PENDING_EMAIL_INTEGRATION',
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Allow anonymous or authenticated contact submissions (insert only)
CREATE POLICY "Anyone can submit support tickets"
    ON public.support_tickets
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Indexes for status and creation date lookup
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at DESC);

