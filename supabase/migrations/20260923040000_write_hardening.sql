-- ==============================================================================
-- Migration: 20260923040000_write_hardening.sql
-- Goal: Step 5 High-Concurrency Database Write Hardening
-- 1. Atomic Stored Function (RPC) for high-concurrency customer check-ins
-- 2. Eliminates 5-8 sequential round-trips down to 1 atomic transaction
-- 3. Row-level locking & ON CONFLICT race condition protection
-- 4. Plan limits and reward uniqueness strong consistency enforcement
-- 5. Additional composite indexes for fast rewards and visit lookups
-- Additive only. Zero drops, zero deletes, zero truncates.
-- ==============================================================================

-- 1. High-Performance Composite Indexes
CREATE INDEX IF NOT EXISTS idx_rewards_customer_status_created
ON public.rewards (customer_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rewards_merchant_customer_status
ON public.rewards (merchant_id, customer_id, status);

CREATE INDEX IF NOT EXISTS idx_scratch_rewards_merchant_enabled
ON public.scratch_card_rewards (merchant_id, is_enabled);

CREATE INDEX IF NOT EXISTS idx_customer_visits_merchant_customer_time
ON public.customer_visits (merchant_id, customer_id, visited_at DESC);

-- 2. Atomic Customer Check-in Stored Function (RPC)
CREATE OR REPLACE FUNCTION public.process_customer_checkin(
    p_slug TEXT,
    p_name TEXT,
    p_phone TEXT,
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
    v_is_first_visit BOOLEAN := false;
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

    -- 2. Find Customer with Row Locking to prevent concurrent race conditions
    SELECT *
    INTO v_customer
    FROM public.customers
    WHERE merchant_id = v_merchant.id AND phone = p_phone
    FOR UPDATE;

    IF NOT FOUND THEN
        -- CASE A: FIRST VISIT / NEW CUSTOMER
        v_is_first_visit := true;

        -- Compute plan limit
        IF v_merchant.plan = 'STARTER' THEN
            v_customer_limit := 1500;
        ELSIF v_merchant.plan = 'GROWTH' THEN
            v_customer_limit := 5000;
        ELSIF v_merchant.plan = 'PRO' THEN
            v_customer_limit := 10000;
        ELSE
            v_customer_limit := 100; -- TRIAL / DEFAULT
        END IF;

        -- Enforce Plan Limit
        IF COALESCE(v_merchant.customer_count, 0) >= v_customer_limit THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Store customer limit reached (' || COALESCE(v_merchant.customer_count, 0) || ' / ' || v_customer_limit || '). Please notify the store owner to upgrade their Ugrahak plan.',
                'status_code', 403
            );
        END IF;

        -- Insert new Customer with unique violation handling
        BEGIN
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
                p_phone,
                1,
                v_now,
                v_now,
                v_now,
                v_now
            )
            RETURNING * INTO v_customer;
        EXCEPTION WHEN unique_violation THEN
            -- Concurrency safety: if another thread inserted concurrently, select existing customer
            SELECT * INTO v_customer
            FROM public.customers
            WHERE merchant_id = v_merchant.id AND phone = p_phone;
            v_is_first_visit := false;
        END;

        IF v_is_first_visit THEN
            -- Insert FIRST_VISIT visit record
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

            -- Select scratch card reward or default
            SELECT name, description, value
            INTO v_title, v_description, v_discount_value
            FROM public.scratch_card_rewards
            WHERE merchant_id = v_merchant.id AND is_enabled = true
            ORDER BY RANDOM()
            LIMIT 1;

            IF v_title IS NULL THEN
                v_title := 'Flat 10% Off On Your Purchase';
                v_description := 'Welcome reward from ' || v_merchant.shop_name || '! Show this code at the billing counter.';
                v_discount_value := '10%';
            ELSE
                IF v_description IS NULL OR v_description = '' THEN
                    v_description := 'Special welcome reward from ' || v_merchant.shop_name || '! Show this code at cashier.';
                END IF;
            END IF;

            -- Insert Reward (with idempotency protection)
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
            ON CONFLICT (customer_id, reward_type) DO NOTHING
            RETURNING * INTO v_reward;

            IF v_reward.id IS NULL THEN
                SELECT * INTO v_reward
                FROM public.rewards
                WHERE customer_id = v_customer.id AND reward_type = 'FIRST_VISIT'
                LIMIT 1;
            END IF;

            -- Insert 30-minute review request if google_maps_url is present
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
        END IF;
    END IF;

    -- CASE B: REPEAT VISIT (or resolved race-condition fallback)
    IF NOT v_is_first_visit THEN
        -- Cooldown check: only increment visit count if last visit was >= 15 minutes ago
        IF (v_now - v_customer.last_visit_at) >= INTERVAL '15 minutes' THEN
            UPDATE public.customers
            SET visit_count = visit_count + 1,
                last_visit_at = v_now,
                updated_at = v_now
            WHERE id = v_customer.id
            RETURNING * INTO v_customer;

            INSERT INTO public.customer_visits (
                merchant_id,
                customer_id,
                visit_type,
                visited_at
            ) VALUES (
                v_merchant.id,
                v_customer.id,
                'REPEAT_VISIT',
                v_now
            );
        END IF;

        -- Fetch latest active reward
        SELECT * INTO v_reward
        FROM public.rewards
        WHERE merchant_id = v_merchant.id
          AND customer_id = v_customer.id
          AND status = 'ACTIVE'
        ORDER BY created_at DESC
        LIMIT 1;
    END IF;

    -- 3. Return consolidated JSON response
    RETURN jsonb_build_object(
        'success', true,
        'status_code', 200,
        'isFirstVisit', v_is_first_visit,
        'visitCount', v_customer.visit_count,
        'customer', jsonb_build_object(
            'id', v_customer.id,
            'name', v_customer.name,
            'phone', v_customer.phone,
            'merchant_id', v_customer.merchant_id
        ),
        'reward', CASE WHEN v_reward.id IS NOT NULL THEN jsonb_build_object(
            'id', v_reward.id,
            'title', v_reward.title,
            'description', v_reward.description,
            'reference_code', v_reward.reference_code,
            'expires_at', v_reward.expires_at,
            'status', v_reward.status
        ) ELSE NULL END
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_customer_checkin TO anon, authenticated, service_role;

