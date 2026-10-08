import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/observability/logger";
import type { Customer, Reward, CustomerVisit } from "@/lib/types/database";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET: Fetch single customer with rewards and visits history for logged-in merchant
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in as a merchant." },
        { status: 401 }
      );
    }

    const { data: customer, error: custError } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .eq("merchant_id", user.id)
      .maybeSingle<Customer>();

    if (custError || !customer) {
      return NextResponse.json(
        { error: "Customer not found or unauthorized." },
        { status: 404 }
      );
    }

    const [rewardsRes, visitsRes] = await Promise.all([
      supabase
        .from("rewards")
        .select("*")
        .eq("customer_id", id)
        .eq("merchant_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("customer_visits")
        .select("*")
        .eq("customer_id", id)
        .eq("merchant_id", user.id)
        .order("visited_at", { ascending: false }),
    ]);

    return NextResponse.json({
      success: true,
      customer,
      rewards: rewardsRes.data || [],
      visits: visitsRes.data || [],
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Delete a customer and associated records (Privacy / GDPR / Merchant isolation)
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const start = Date.now();
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in as a merchant." },
        { status: 401 }
      );
    }

    const admin = createAdminClient();

    // 1. Verify customer belongs strictly to this merchant
    const { data: existingCustomer, error: findError } = await admin
      .from("customers")
      .select("id, name")
      .eq("id", id)
      .eq("merchant_id", user.id)
      .maybeSingle<{ id: string; name: string }>();

    if (findError || !existingCustomer) {
      return NextResponse.json(
        { error: "Customer not found or unauthorized." },
        { status: 404 }
      );
    }

    // 2. Cascade delete customer record and all related tokens/rewards/visits
    const { error: deleteError } = await admin
      .from("customers")
      .delete()
      .eq("id", id)
      .eq("merchant_id", user.id);

    if (deleteError) {
      logger.error("Failed to delete customer record", {
        operation: "DELETE_CUSTOMER",
        merchantId: user.id,
        customerId: id,
      }, deleteError);

      return NextResponse.json(
        { error: `Database error deleting customer: ${deleteError.message}` },
        { status: 500 }
      );
    }

    logger.info("Customer record deleted successfully", {
      operation: "DELETE_CUSTOMER",
      merchantId: user.id,
      customerId: id,
      durationMs: Date.now() - start,
    });

    return NextResponse.json({
      success: true,
      message: "Customer and associated reward history deleted successfully.",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

