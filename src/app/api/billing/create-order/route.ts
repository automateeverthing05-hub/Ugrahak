import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createRazorpayOrder } from "@/lib/billing/razorpay";
import { createOrderSchema, formatZodError } from "@/lib/validation/schemas";
import { logger } from "@/lib/observability/logger";
import type { PlanId } from "@/lib/billing/plans";

/**
 * POST /api/billing/create-order
 *
 * Creates a Razorpay order for the authenticated merchant.
 * Validates plan against authoritative PLANS config on the server.
 * Never trusts client-supplied price.
 *
 * Request body: { plan: "STARTER" | "GROWTH" | "PRO" }
 * Response: { orderId, amount, currency, keyId, plan, planName, amountINR }
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

    // 2. Validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const parseResult = createOrderSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error).error },
        { status: 400 }
      );
    }

    const { plan } = parseResult.data as { plan: PlanId };

    // 3. Verify merchant exists
    const { data: merchant } = await supabase
      .from("merchants")
      .select("id, shop_name, plan")
      .eq("id", user.id)
      .maybeSingle<{ id: string; shop_name: string; plan: string }>();

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant profile not found." },
        { status: 404 }
      );
    }

    // 4. Prevent duplicate upgrade if already on this plan
    if (merchant.plan === plan) {
      return NextResponse.json(
        { error: `Your store is already on the ${plan} plan.` },
        { status: 400 }
      );
    }

    // 5. Create Razorpay order (validates plan and retrieves price from server config)
    const orderResult = await createRazorpayOrder(user.id, plan);

    logger.info("Billing order created for merchant", {
      operation: "CREATE_ORDER",
      merchantId: user.id,
      metadata: { plan, orderId: orderResult.orderId },
    });

    return NextResponse.json(orderResult, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create payment order.";
    logger.error("Billing create-order error", {
      operation: "CREATE_ORDER",
    }, err);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

