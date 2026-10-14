import { NextResponse, type NextRequest } from "next/server";
import { logger } from "@/lib/observability/logger";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let reportData: Record<string, unknown> = {};

    if (contentType.includes("application/csp-report") || contentType.includes("application/json")) {
      reportData = await request.json().catch(() => ({}));
    }

    const cspReport = (reportData["csp-report"] || reportData) as Record<string, unknown>;

    // Log CSP violation without collecting personal details
    logger.warn("CSP Violation Reported", {
      operation: "CSP_REPORT",
      metadata: {
        documentUri: typeof cspReport["document-uri"] === "string" ? cspReport["document-uri"].split("?")[0] : undefined,
        blockedUri: typeof cspReport["blocked-uri"] === "string" ? cspReport["blocked-uri"].split("?")[0] : undefined,
        violatedDirective: cspReport["violated-directive"],
        effectiveDirective: cspReport["effective-directive"],
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
