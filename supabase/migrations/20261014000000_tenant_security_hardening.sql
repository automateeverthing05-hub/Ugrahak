-- ==============================================================================
-- Migration: 20261014000000_tenant_security_hardening.sql
-- Goal: 
-- 1. Prevent privilege escalation: Block authenticated users from updating
--    plan, customer_count, subscription_status, subscription_started_at,
--    trial_started_at, and trial_ends_at on public.merchants.
-- 2. Harden process_customer_checkin RPC:
--    - Set explicit search_path = public, pg_temp via ALTER FUNCTION
--    - REVOKE EXECUTE from PUBLIC, anon, and authenticated
--    - GRANT EXECUTE only to service_role (checkin route invokes via admin client)
-- 3. Strict RLS on support_tickets:
--    - Add CHECK constraints on text lengths
--    - REVOKE ALL from PUBLIC, anon, authenticated (insert-only via service_role backend API)
--    - GRANT ALL to service_role
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Block unauthorized column updates on public.merchants
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_merchant_plan_protection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- If executed by service_role (e.g. backend admin tasks/migrations), permit modifications
    IF (auth.jwt() ->> 'role') = 'service_role' OR current_user = 'postgres' THEN
        RETURN NEW;
    END IF;

    -- For authenticated merchants updating their own profile:
    -- Strictly prohibit changing plan, customer_count, or subscription fields
    IF NEW.plan IS DISTINCT FROM OLD.plan THEN
        RAISE EXCEPTION 'Unauthorized: Merchant cannot change plan directly. Contact support for plan upgrades.';
    END IF;

    IF NEW.customer_count IS DISTINCT FROM OLD.customer_count THEN
        RAISE EXCEPTION 'Unauthorized: Merchant cannot modify customer_count directly.';
    END IF;

    IF NEW.subscription_status IS DISTINCT FROM OLD.subscription_status THEN
        RAISE EXCEPTION 'Unauthorized: Merchant cannot modify subscription_status directly.';
    END IF;

    IF NEW.subscription_started_at IS DISTINCT FROM OLD.subscription_started_at THEN
        RAISE EXCEPTION 'Unauthorized: Merchant cannot modify subscription_started_at.';
    END IF;

    IF NEW.trial_started_at IS DISTINCT FROM OLD.trial_started_at THEN
        RAISE EXCEPTION 'Unauthorized: Merchant cannot modify trial_started_at.';
    END IF;

    IF NEW.trial_ends_at IS DISTINCT FROM OLD.trial_ends_at THEN
        RAISE EXCEPTION 'Unauthorized: Merchant cannot modify trial_ends_at.';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_merchant_plan_protection ON public.merchants;
CREATE TRIGGER trg_enforce_merchant_plan_protection
    BEFORE UPDATE ON public.merchants
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_merchant_plan_protection();


-- ------------------------------------------------------------------------------
-- 2. Harden process_customer_checkin RPC function
--    Preserve exact original body from 20260924000000_remove_customer_phone.sql
--    Apply search_path via ALTER FUNCTION and restrict execute grant to service_role only
-- ------------------------------------------------------------------------------
ALTER FUNCTION public.process_customer_checkin(TEXT, TEXT, TEXT) SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.process_customer_checkin(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_customer_checkin(TEXT, TEXT, TEXT) TO service_role;


-- ------------------------------------------------------------------------------
-- 3. Harden support_tickets:
--    Add validation CHECK constraints and restrict access strictly to service_role
-- ------------------------------------------------------------------------------
ALTER TABLE public.support_tickets
    ADD CONSTRAINT chk_support_tickets_name_len CHECK (length(trim(name)) > 0 AND length(name) <= 100),
    ADD CONSTRAINT chk_support_tickets_contact_len CHECK (length(trim(contact_info)) > 0 AND length(contact_info) <= 255),
    ADD CONSTRAINT chk_support_tickets_message_len CHECK (length(trim(message)) > 0 AND length(message) <= 2000),
    ADD CONSTRAINT chk_support_tickets_topic_len CHECK (length(topic) <= 100);

REVOKE ALL ON public.support_tickets FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.support_tickets TO service_role;
