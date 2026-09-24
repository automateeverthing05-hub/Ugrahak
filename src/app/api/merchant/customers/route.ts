import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/observability/logger";
import type { Customer, Reward } from "@/lib/types/database";

export interface PaginatedCustomerItem extends Customer {
  rewards?: Reward[];
}

/**
 * GET /api/merchant/customers
 * High-performance, paginated customer directory with search and filtering.
 *
 * Query Params:
 * - page: number (default: 1)
 * - limit: number (default: 25, min: 1, max: 100)
 * - search: string (name or phone search)
 * - filter: "ALL" | "FIRST" | "REPEAT" (default: "ALL")
 */
export async function GET(request: NextRequest) {
  const start = Date.now();

  try {
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

    const { searchParams } = new URL(request.url);
    const rawPage = parseInt(searchParams.get("page") || "1", 10);
    const rawLimit = parseInt(searchParams.get("limit") || "25", 10);
    const search = searchParams.get("search")?.trim() || "";
    const filter = searchParams.get("filter") || "ALL";

    const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
    const limit = isNaN(rawLimit) || rawLimit < 1 ? 25 : Math.min(rawLimit, 100);
    const offset = (page - 1) * limit;

    let query = supabase
      .from("customers")
      .select(
        "id, merchant_id, name, phone, visit_count, first_visit_at, last_visit_at, created_at, updated_at, rewards(id, title, status, reference_code, expires_at)",
        { count: "exact" }
      )
      .eq("merchant_id", user.id);

    // Apply Filter (FIRST vs REPEAT)
    if (filter === "FIRST") {
      query = query.eq("visit_count", 1);
    } else if (filter === "REPEAT") {
      query = query.gt("visit_count", 1);
    }

    // Apply Search Filter (Name or Phone ILIKE)
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // Apply Pagination and Sorting
    const { data: customers, count, error: fetchError } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (fetchError) {
      logger.error("Failed to query merchant customers", {
        operation: "GET_PAGINATED_CUSTOMERS",
        merchantId: user.id,
        durationMs: Date.now() - start,
      }, fetchError);

      return NextResponse.json(
        { error: `Database error: ${fetchError.message}` },
        { status: 500 }
      );
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit) || 1;
    const hasMore = page < totalPages;

    const durationMs = Date.now() - start;
    logger.info("Fetched paginated customers", {
      operation: "GET_PAGINATED_CUSTOMERS",
      merchantId: user.id,
      durationMs,
      metadata: { page, limit, totalCount, returnedCount: customers?.length || 0 },
    });

    return NextResponse.json({
      success: true,
      customers: customers || [],
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore,
      },
    });
  } catch (err: unknown) {
    logger.error("Unexpected error in paginated customers endpoint", {
      operation: "GET_PAGINATED_CUSTOMERS",
      durationMs: Date.now() - start,
    }, err);

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

