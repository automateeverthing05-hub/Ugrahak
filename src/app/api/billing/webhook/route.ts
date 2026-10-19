import { NextResponse, type NextRequest } from "next/server";
import { verifyRazorpayWebhookSignature, activateMerchantPlan } from "@/lib/billing/razorpay";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/observability/logger";
import type { PlanId } from "@/lib/billing/plans";

/**
 * POST /api/billing/webhook
 *
 * Razorpay webhook handler.
 * Handles: payment.captured, order.paid
 * Idempotent: unique razorpay_payment_id constraint prevents duplicate activations.
 * Security: HMAC-SHA256 signature verified with timingSafeEqual before processing.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Read raw body for HMAC verification
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") || "";

    // 2. Verify webhook signature
    const isValid = verifyRazorpayWebhookSignature(rawBody, signature);
    if (!isValid) {
      logger.warn("Razorpay webhook signature validation FAILED", {
        operation: "RAZORPAY_WEBHOOK",
        metadata: { signatureHeader: signature.slice(0, 8) + "..." },
      });
      return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
    }

    // 3. Parse webhook payload
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const event = payload.event as string;
    logger.info("Razorpay webhook received", {
      operation: "RAZORPAY_WEBHOOK",
      metadata: { event },
    });

    // 4. Handle payment.captured and order.paid
    if (event === "payment.captured" || event === "order.paid") {
      const payloadData = payload.payload as Record<string, unknown> | undefined;
      const paymentObj = payloadData?.payment as Record<string, unknown> | undefined;
      const orderObj = payloadData?.order as Record<string, unknown> | undefined;

      const pEntity = paymentObj?.entity as Record<string, unknown> | undefined;
      const oEntity = orderObj?.entity as Record<string, unknown> | undefined;

      const razorpayPaymentId = (pEntity?.id as string) || "";
      const razorpayOrderId = (pEntity?.order_id as string) || (oEntity?.id as string) || "";
      const status = (pEntity?.status as string) || (oEntity?.status as string) || "";

      if (!razorpayOrderId) {
        return NextResponse.json({ received: true, note: "No order id in payload." }, { status: 200 });
      }

      if (status !== "captured" && status !== "paid" && event !== "order.paid") {
        // Not captured / paid — skip activation
        return NextResponse.json({ received: true, note: `Payment status: ${status}` }, { status: 200 });
      }

      const admin = createAdminClient();

      // 5. Find the payment record in our DB to identify merchant_id and plan
      const { data: paymentRecord } = await admin
        .from("payments")
        .select("merchant_id, plan, status")
        .eq("razorpay_order_id", razorpayOrderId)
        .maybeSingle();

      if (!paymentRecord) {
        // No matching order — may be from a different source
        logger.warn("Webhook: no matching payment record for order", {
          operation: "RAZORPAY_WEBHOOK",
          metadata: { razorpayOrderId, event },
        });
        return NextResponse.json({ received: true, note: "No matching order." }, { status: 200 });
      }

      // 6. Idempotency check: skip if already CAPTURED
      if (paymentRecord.status === "CAPTURED") {
        return NextResponse.json({ received: true, note: "Already processed." }, { status: 200 });
      }

      // 7. Verify payment ID not already used (duplicate webhook protection)
      const { data: existingPayment } = await admin
        .from("payments")
        .select("id")
        .eq("razorpay_payment_id", razorpayPaymentId)
        .maybeSingle();

      if (existingPayment) {
        return NextResponse.json({ received: true, note: "Duplicate payment ID." }, { status: 200 });
      }

      // 8. Activate merchant plan
      const planId = paymentRecord.plan as PlanId;
      const result = await activateMerchantPlan(
        paymentRecord.merchant_id,
        planId,
        razorpayPaymentId,
        razorpayOrderId
      );

      if (result.success) {
        logger.info("Merchant plan activated via webhook", {
          operation: "RAZORPAY_WEBHOOK",
          merchantId: paymentRecord.merchant_id,
          metadata: { planId, razorpayPaymentId, event },
        });
      } else {
        logger.error("Webhook plan activation failed", {
          operation: "RAZORPAY_WEBHOOK",
          merchantId: paymentRecord.merchant_id,
          metadata: { planId, razorpayPaymentId, error: result.error },
        });
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: unknown) {
    logger.error("Razorpay webhook handler error", { operation: "RAZORPAY_WEBHOOK" }, err);
    // Return 200 so Razorpay doesn't retry endlessly on unexpected server errors
    return NextResponse.json({ received: true, error: "Internal error" }, { status: 200 });
  }
}

