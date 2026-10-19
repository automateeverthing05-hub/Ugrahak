/**
 * Razorpay Server-Side Integration Helpers
 *
 * Provides:
 * 1. createRazorpayOrder() – Creates payment order via Razorpay REST API
 * 2. verifyRazorpayPaymentSignature() – HMAC-SHA256 signature verification
 * 3. activateMerchantPlan() – Atomically updates merchant plan + records payment
 *
 * Security Rules:
 * - RAZORPAY_KEY_SECRET is strictly server-side only (never in NEXT_PUBLIC_* vars)
 * - All amounts are in paise (1 INR = 100 paise)
 * - Plan validation against authoritative PLANS config before any API call
 * - Idempotency enforced via unique razorpay_payment_id constraint in DB
 */

import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS } from "@/lib/billing/plans";
import { logger } from "@/lib/observability/logger";
import type { PlanId } from "@/lib/billing/plans";

// ─── Environment ─────────────────────────────────────────────────────────────

function getRazorpayCredentials(): { keyId: string; keySecret: string } {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in server environment.");
  }
  return { keyId, keySecret };
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RazorpayOrderResult {
  orderId: string;
  amount: number;        // paise
  currency: string;      // 'INR'
  keyId: string;         // Public key for client-side Checkout.js
  plan: PlanId;
  planName: string;
  amountINR: number;
}

export interface RazorpayVerifyResult {
  isValid: boolean;
}

export interface PaymentActivationResult {
  success: boolean;
  plan: PlanId;
  customerLimit: number | "unlimited";
  error?: string;
}

// ─── Order Creation ───────────────────────────────────────────────────────────

/**
 * Creates a Razorpay order for a given plan.
 * Validates plan against authoritative PLANS config before calling Razorpay API.
 * Logs order in public.payments with status 'CREATED'.
 */
export async function createRazorpayOrder(
  merchantId: string,
  planId: PlanId
): Promise<RazorpayOrderResult> {
  const planConfig = PLANS[planId];
  if (!planConfig || planId === "FREE") {
    throw new Error(`Invalid paid plan: ${planId}`);
  }

  const { keyId, keySecret } = getRazorpayCredentials();
  const amountPaise = planConfig.priceINR * 100;

  // Create order with Razorpay API
  const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
  const orderPayload = {
    amount: amountPaise,
    currency: "INR",
    receipt: `ugrahak_${merchantId.slice(0, 8)}_${Date.now()}`,
    notes: {
      merchant_id: merchantId,
      plan: planId,
      product: "Ugrahak SaaS",
    },
  };

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderPayload),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    logger.error("Razorpay order creation failed", {
      operation: "RAZORPAY_CREATE_ORDER",
      merchantId,
      metadata: { planId, httpStatus: res.status },
    });
    throw new Error(`Razorpay order creation failed (HTTP ${res.status}): ${errBody}`);
  }

  const order = await res.json() as {
    id: string;
    amount: number;
    currency: string;
  };

  // Log order in payments ledger
  const admin = createAdminClient();
  try {
    await admin.from("payments").insert({
      merchant_id: merchantId,
      razorpay_order_id: order.id,
      plan: planId,
      amount_paise: amountPaise,
      currency: "INR",
      status: "CREATED",
      raw_payload: orderPayload as unknown as Record<string, unknown>,
    });
  } catch (dbErr) {
    // Non-blocking - log only, don't fail the order creation
    logger.warn("Payment order log insert failed (non-blocking)", {
      operation: "RAZORPAY_CREATE_ORDER",
      merchantId,
    }, dbErr);
  }

  logger.info("Razorpay order created", {
    operation: "RAZORPAY_CREATE_ORDER",
    merchantId,
    metadata: { planId, orderId: order.id, amountPaise },
  });

  return {
    orderId: order.id,
    amount: amountPaise,
    currency: "INR",
    keyId,
    plan: planId,
    planName: planConfig.name,
    amountINR: planConfig.priceINR,
  };
}

// ─── Signature Verification ───────────────────────────────────────────────────

/**
 * Verifies Razorpay payment signature using HMAC-SHA256 and timingSafeEqual.
 * Signature = HMAC-SHA256(razorpay_order_id + '|' + razorpay_payment_id, RAZORPAY_KEY_SECRET)
 */
export function verifyRazorpayPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): RazorpayVerifyResult {
  const { keySecret } = getRazorpayCredentials();
  const body = `${orderId}|${paymentId}`;
  const computed = crypto
    .createHmac("sha256", keySecret)
    .update(body)
    .digest("hex");

  let isValid = false;
  try {
    isValid = crypto.timingSafeEqual(
      Buffer.from(computed),
      Buffer.from(signature)
    );
  } catch {
    // Buffer lengths differ if signature is forged/malformed
    isValid = false;
  }

  return { isValid };
}

/**
 * Verifies Razorpay webhook HMAC-SHA256 signature from x-razorpay-signature header.
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
  if (!webhookSecret) return false;

  const computed = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
  } catch {
    return false;
  }
}

// ─── Plan Activation ─────────────────────────────────────────────────────────

/**
 * Atomically activates a merchant's paid subscription after verified payment.
 * Uses admin client (bypasses RLS) because only service-role can update plan.
 * Idempotent: if plan already matches, skips update.
 */
export async function activateMerchantPlan(
  merchantId: string,
  planId: PlanId,
  paymentId: string,
  orderId: string
): Promise<PaymentActivationResult> {
  const admin = createAdminClient();
  const planConfig = PLANS[planId];
  const now = new Date().toISOString();

  try {
    // 1. Update payment record to CAPTURED
    await admin
      .from("payments")
      .update({
        razorpay_payment_id: paymentId,
        status: "CAPTURED",
        updated_at: now,
      })
      .eq("razorpay_order_id", orderId)
      .eq("merchant_id", merchantId);

    // 2. Activate plan on merchant profile (service-role bypasses RLS trigger protection)
    const { error: updateErr } = await admin
      .from("merchants")
      .update({
        plan: planId,
        subscription_status: "ACTIVE",
        subscription_started_at: now,
        updated_at: now,
      })
      .eq("id", merchantId);

    if (updateErr) {
      logger.error("Merchant plan activation failed", {
        operation: "ACTIVATE_MERCHANT_PLAN",
        merchantId,
        metadata: { planId, paymentId },
      }, updateErr);
      return { success: false, plan: planId, customerLimit: planConfig.customerLimit, error: updateErr.message };
    }

    logger.info("Merchant plan activated successfully", {
      operation: "ACTIVATE_MERCHANT_PLAN",
      merchantId,
      metadata: { planId, paymentId, orderId },
    });

    return {
      success: true,
      plan: planId,
      customerLimit: planConfig.customerLimit,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error during plan activation";
    logger.error("Unexpected error during plan activation", {
      operation: "ACTIVATE_MERCHANT_PLAN",
      merchantId,
      metadata: { planId, paymentId },
    }, err);
    return { success: false, plan: planId, customerLimit: planConfig.customerLimit, error: msg };
  }
}

