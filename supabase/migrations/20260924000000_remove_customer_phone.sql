-- ==============================================================================
-- Migration: 20260924000000_remove_customer_phone.sql
-- Goal: Remove customer phone number collection and support unique scan identity
-- 1. Drop NOT NULL constraint on customers.phone (backward compatible with historical records)
-- 2. Drop unique constraint uq_merchant_customer_phone
-- 3. Drop index idx_customers_merchant_phone
-- 4. Create index on (merchant_id, name)
-- 5. Update process_customer_checkin stored function for pure name + unique scan ID
-- ==============================================================================

-- 1. Make phone nullable in customers table
ALTER TABLE public.customers ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.customers ALTER COLUMN phone SET DEFAULT NULL;

-- 2. Drop unique phone constraint on customers
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS uq_merchant_customer_phone;

-- 3. Drop old phone index
DROP INDEX IF EXISTS idx_customers_merchant_phone;

-- 4. Add index for merchant customer name searches
CREATE INDEX IF NOT EXISTS idx_customers_merchant_name ON public.customers(merchant_id, name);

-- 5. Update Atomic Customer Check-in Function (RPC) without phone dependency
CREATE OR REPLACE FUNCTION public.process_customer_checkin(
    p_slug TEXT,
    p_name TEXT,
    p_reference_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
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
    -- 1. Find Merchant by case-insensitive slug
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

    -- 2. Compute plan limit
    IF v_merchant.plan = 'STARTER' THEN
        v_customer_limit := 1500;
    ELSIF v_merchant.plan = 'GROWTH' THEN
        v_customer_limit := 5000;
    ELSIF v_merchant.plan = 'PRO' THEN
        v_customer_limit := 10000;
    ELSE
        v_customer_limit := 100; -- TRIAL / DEFAULT
    END IF;

    -- 3. Enforce Plan Limit
    IF COALESCE(v_merchant.customer_count, 0) >= v_customer_limit THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Store customer limit reached (' || COALESCE(v_merchant.customer_count, 0) || ' / ' || v_customer_limit || '). Please notify the store owner to upgrade their Ugrahak plan.',
            'status_code', 403
        );
    END IF;

    -- 4. Insert new Customer record with a new server-generated UUID on every scan
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

    -- 5. Insert FIRST_VISIT visit record
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

    -- 6. Select scratch card reward or default
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

    -- 7. Insert Reward
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
        p_reference_code,
        v_now,
        v_expiry,
        v_now
    )
    RETURNING * INTO v_reward;

    -- 8. Insert 30-minute review request if google_maps_url is present
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

    -- 9. Return consolidated JSON response
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

GRANT EXECUTE ON FUNCTION public.process_customer_checkin TO anon, authenticated, service_role;

