import fs from "node:fs";
import path from "node:path";

function parse() {
  const stages = [100, 250, 500, 1000];
  const summary: any[] = [];
  const endpointMetrics: Record<string, any> = {};

  for (const vus of stages) {
    const f = path.resolve(process.cwd(), `k6-summary-${vus}vu.json`);
    if (!fs.existsSync(f)) {
      console.log(`Missing ${f}`);
      continue;
    }
    const data = JSON.parse(fs.readFileSync(f, "utf8"));
    const m = data.metrics;

    const dur = m.http_req_duration || {};
    const reqs = m.http_reqs?.count ?? 0;
    const rps = m.http_reqs?.rate ?? 0;
    const h2xx = m.http_2xx_requests?.count ?? 0;
    const h4xx = m.http_4xx_requests?.count ?? 0;
    const h429 = m.http_429_requests?.count ?? 0;
    const h5xx = m.http_5xx_requests?.count ?? 0;
    const to = m.timeout_requests?.count ?? 0;
    const conn = m.connection_error_requests?.count ?? 0;

    const p50 = dur["p(50)"] ?? dur.med ?? 0;
    const p90 = dur["p(90)"] ?? 0;
    const p95 = dur["p(95)"] ?? 0;
    const p99 = dur["p(99)"] ?? 0;
    const max = dur.max ?? 0;
    const avg = dur.avg ?? 0;

    const fatalErrors = h5xx + to + conn;
    const errorPct = reqs > 0 ? (fatalErrors / reqs) * 100 : 0;

    summary.push({
      test: `TEST (${vus} VUs)`,
      vus: vus,
      duration: vus === 1000 ? "10m" : "5m",
      requests: reqs,
      rps: parseFloat(rps.toFixed(2)),
      http2xx: h2xx,
      http4xx: h4xx,
      http429: h429,
      http5xx: h5xx,
      connErrors: conn,
      timeouts: to,
      p50: parseFloat(p50.toFixed(2)),
      p95: parseFloat(p95.toFixed(2)),
      p99: parseFloat(p99.toFixed(2)),
      max: parseFloat(max.toFixed(2)),
    });

    endpointMetrics[vus] = {
      checkin: m.checkin_duration || {},
      shop_view: m.shop_view_duration || {},
      nearby: m.nearby_duration || {},
      customer_dash: m.customer_dash_duration || {},
      offers: m.offers_duration || {},
      analytics: m.analytics_duration || {},
    };
  }

  console.log("=== LOAD TEST SUMMARY ===");
  console.log(JSON.stringify(summary, null, 2));

  console.log("\n=== ENDPOINT BREAKDOWN (1000 VUs) ===");
  const e1000 = endpointMetrics[1000];
  if (e1000) {
    for (const [ep, obj] of Object.entries(e1000) as [string, any][]) {
      console.log(`${ep}: med=${(obj.med || 0).toFixed(1)}ms, p(90)=${(obj["p(90)"] || 0).toFixed(1)}ms, p(95)=${(obj["p(95)"] || 0).toFixed(1)}ms, avg=${(obj.avg || 0).toFixed(1)}ms, max=${(obj.max || 0).toFixed(1)}ms`);
    }
  }

  console.log("\n=== ENDPOINT BREAKDOWN (100 VUs) ===");
  const e100 = endpointMetrics[100];
  if (e100) {
    for (const [ep, obj] of Object.entries(e100) as [string, any][]) {
      console.log(`${ep}: med=${(obj.med || 0).toFixed(1)}ms, p(90)=${(obj["p(90)"] || 0).toFixed(1)}ms, p(95)=${(obj["p(95)"] || 0).toFixed(1)}ms, avg=${(obj.avg || 0).toFixed(1)}ms, max=${(obj.max || 0).toFixed(1)}ms`);
    }
  }
}

parse();
