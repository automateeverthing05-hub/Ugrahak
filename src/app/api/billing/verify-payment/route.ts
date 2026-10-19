import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyRazorpayPaymentSignature, activateMerchantPlan } from "@/lib/billing/razorpay";
import { verifyPaymentSchema, formatZodError } from "@/lib/validation/schemas";
import { getPlanConfig } from "@/lib/billing/plans";
import { logger } from "@/lib/observability/logger";
import type { PlanId } from "@/lib/billing/plans";

/**
 * POST /api/billing/verify-payment
 *
 * Verifies Razorpay payment signature on the server and activates merchant subscription.
 * Never trusts client-supplied plan; re-validates against authoritative plan config.
 *
 * Request body: { orderId, paymentId, signature, plan }
 * Response: { success: true, plan, customerLimit }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate merchant
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required. Please log in to continue." },
        { status: 401 }
      );
    }

    // 2. Validate and parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const parseResult = verifyPaymentSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error).error },
        { status: 400 }
      );
    }

    const { orderId, paymentId, signature, plan } = parseResult.data as {
      orderId: string;
      paymentId: string;
      signature: string;
      plan: PlanId;
    };

    // 3. Verify merchant exists
    const { data: merchant } = await supabase
      .from("merchants")
      .select("id, shop_name")
      .eq("id", user.id)
      .maybeSingle<{ id: string; shop_name: string }>();

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant profile not found." },
        { status: 404 }
      );
    }

    // 4. Server-side HMAC-SHA256 signature verification (timingSafeEqual)
    const { isValid } = verifyRazorpayPaymentSignature(orderId, paymentId, signature);
    if (!isValid) {
      logger.warn("Razorpay payment signature verification FAILED", {
        operation: "VERIFY_PAYMENT",
        merchantId: user.id,
        metadata: { orderId, paymentId, plan },
      });
      return NextResponse.json(
        { error: "Payment verification failed. Invalid signature." },
        { status: 400 }
      );
    }

    // 5. Validate plan config exists (server-side; never trust client-supplied limits)
    const planConfig = getPlanConfig(plan);
    if (planConfig.id === "FREE" || planConfig.id !== plan) {
      return NextResponse.json(
        { error: `Invalid plan selected: ${plan}` },
        { status: 400 }
      );
    }

    // 6. Activate merchant plan atomically
    const result = await activateMerchantPlan(user.id, plan, paymentId, orderId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to activate subscription. Contact support." },
        { status: 500 }
      );
    }

    logger.info("Merchant subscription activated via payment verification", {
      operation: "VERIFY_PAYMENT",
      merchantId: user.id,
      metadata: { plan, paymentId, orderId },
    });

    return NextResponse.json({
      success: true,
      plan: result.plan,
      planName: planConfig.name,
      customerLimit: result.customerLimit,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error verifying payment.";
    logger.error("Billing verify-payment error", { operation: "VERIFY_PAYMENT" }, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

