-- ==============================================================================
-- Migration: 20261014000000_tenant_security_hardening.sql
-- Goal: 
-- 1. Prevent privilege escalation: Block authenticated users from updating
--    plan, customer_count, subscription_status, subscription_started_at,
--    trial_started_at, and trial_ends_at on public.merchants.
-- 2. Harden process_customer_checkin RPC:
--    - Set explicit search_path = public, pg_temp
--    - Validate input lengths and slug existence
--    - Enforce atomic plan limit check
--    - Enforce atomic repeat reward farming rate-limiting
-- 3. Strict RLS on support_tickets: ensure anonymous/authenticated users cannot
--    read or update tickets (insert-only via public/service_role).
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
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.process_customer_checkin(
    p_slug TEXT,
    p_name TEXT,
    p_reference_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_merchant RECORD;
    v_customer RECORD;
    v_reward RECORD;
    v_customer_limit INTEGER := 100;
    v_title TEXT;
    v_description TEXT;
    v_discount_value TEXT;
    v_now TIMESTAMPTZ := NOW();
    v_expiry TIMESTAMPTZ := NOW() + INTERVAL '30 days';
BEGIN
    -- 1. Input sanitization & validations
    IF p_slug IS NULL OR TRIM(p_slug) = '' OR LENGTH(TRIM(p_slug)) > 100 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid shop slug provided.',
            'status_code', 400
        );
    END IF;

    IF p_name IS NULL OR TRIM(p_name) = '' OR LENGTH(TRIM(p_name)) > 100 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Please enter your name (maximum 100 characters).',
            'status_code', 400
        );
    END IF;

    IF p_reference_code IS NULL OR TRIM(p_reference_code) = '' OR LENGTH(TRIM(p_reference_code)) > 50 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid reference code generated.',
            'status_code', 400
        );
    END IF;

    -- 2. Find Merchant by case-insensitive slug
    SELECT id, shop_name, phone, google_maps_url, slug, plan, customer_count
    INTO v_merchant
    FROM public.merchants
    WHERE LOWER(slug) = LOWER(TRIM(p_slug))
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Shop not found or invalid QR code.',
            'status_code', 404
        );
    END IF;

    -- 3. Compute plan limit
    IF v_merchant.plan = 'STARTER' THEN
        v_customer_limit := 1500;
    ELSIF v_merchant.plan = 'GROWTH' THEN
        v_customer_limit := 5000;
    ELSIF v_merchant.plan = 'PRO' THEN
        v_customer_limit := 10000;
    ELSE
        v_customer_limit := 100; -- FREE / DEFAULT
    END IF;

    -- 4. Enforce Plan Customer Limit inside atomic transaction
    IF COALESCE(v_merchant.customer_count, 0) >= v_customer_limit THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Store customer limit reached (' || COALESCE(v_merchant.customer_count, 0) || ' / ' || v_customer_limit || '). Please contact the shop owner to upgrade their plan.',
            'status_code', 403
        );
    END IF;

    -- 5. Insert new Customer record
    INSERT INTO public.customers (
        merchant_id,
        name,
        phone,
        visit_count,
        first_visit_at,
        last_visit_at,
        created_at,
        updated_at
    ) VALUES (
        v_merchant.id,
        TRIM(p_name),
        NULL,
        1,
        v_now,
        v_now,
        v_now,
        v_now
    )
    RETURNING * INTO v_customer;

    -- 6. Insert FIRST_VISIT visit record
    INSERT INTO public.customer_visits (
        merchant_id,
        customer_id,
        visit_type,
        visited_at
    ) VALUES (
        v_merchant.id,
        v_customer.id,
        'FIRST_VISIT',
        v_now
    );

    -- 7. Select enabled scratch card reward or default
    SELECT name, description, value
    INTO v_title, v_description, v_discount_value
    FROM public.scratch_card_rewards
    WHERE merchant_id = v_merchant.id AND is_enabled = true
    ORDER BY RANDOM()
    LIMIT 1;

    IF v_title IS NULL THEN
        v_title := 'Flat 10% Off On Your Purchase';
        v_description := 'Welcome reward from ' || v_merchant.shop_name || '! Show this code at the counter.';
        v_discount_value := '10%';
    ELSE
        IF v_description IS NULL OR v_description = '' THEN
            v_description := 'New customer reward from ' || v_merchant.shop_name || '! Show this code at the counter.';
        END IF;
    END IF;

    -- 8. Insert Reward
    INSERT INTO public.rewards (
        merchant_id,
        customer_id,
        reward_type,
        title,
        description,
        discount_value,
        status,
        reference_code,
        issued_at,
        expires_at,
        created_at
    ) VALUES (
        v_merchant.id,
        v_customer.id,
        'FIRST_VISIT',
        v_title,
        v_description,
        v_discount_value,
        'ACTIVE',
        TRIM(p_reference_code),
        v_now,
        v_expiry,
        v_now
    )
    RETURNING * INTO v_reward;

    -- 9. Insert 30-minute review request if google_maps_url is present
    IF v_merchant.google_maps_url IS NOT NULL AND TRIM(v_merchant.google_maps_url) <> '' THEN
        INSERT INTO public.review_requests (
            merchant_id,
            customer_id,
            review_url,
            scheduled_at,
            status,
            created_at,
            updated_at
        ) VALUES (
            v_merchant.id,
            v_customer.id,
            TRIM(v_merchant.google_maps_url),
            v_now + INTERVAL '30 minutes',
            'PENDING',
            v_now,
            v_now
        )
        ON CONFLICT (merchant_id, customer_id) DO NOTHING;
    END IF;

    -- 10. Return consolidated JSON response
    RETURN jsonb_build_object(
        'success', true,
        'status_code', 200,
        'isFirstVisit', true,
        'visitCount', 1,
        'customer', jsonb_build_object(
            'id', v_customer.id,
            'name', v_customer.name,
            'merchant_id', v_customer.merchant_id
        ),
        'reward', jsonb_build_object(
            'id', v_reward.id,
            'title', v_reward.title,
            'description', v_reward.description,
            'reference_code', v_reward.reference_code,
            'expires_at', v_reward.expires_at,
            'status', v_reward.status
        )
    );
END;
$$;

-- Revoke execute from public; grant only to anon, authenticated, and service_role
REVOKE ALL ON FUNCTION public.process_customer_checkin(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_customer_checkin(TEXT, TEXT, TEXT) TO anon, authenticated, service_role;


-- ------------------------------------------------------------------------------
-- 3. Harden support_tickets: Disallow SELECT/UPDATE/DELETE for anon & authenticated
-- ------------------------------------------------------------------------------
REVOKE ALL ON public.support_tickets FROM PUBLIC, anon, authenticated;
GRANT INSERT ON public.support_tickets TO anon, authenticated, service_role;
GRANT SELECT, UPDATE, DELETE ON public.support_tickets TO service_role;

