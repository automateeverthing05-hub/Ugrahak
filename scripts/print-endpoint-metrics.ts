import fs from "node:fs";

for (const vus of [100, 250, 500, 1000]) {
  const f = `k6-summary-${vus}vu.json`;
  const data = JSON.parse(fs.readFileSync(f, "utf8"));
  const m = data.metrics;
  console.log(`=== ${vus} VUs Endpoint Breakdown ===`);
  for (const trend of ["checkin_duration", "shop_view_duration", "nearby_duration", "token_reg_duration", "http_req_duration"]) {
    if (m[trend]) {
      const v = m[trend];
      console.log(`  ${trend}: med=${(v.med || 0).toFixed(1)}ms, p(90)=${(v["p(90)"] || 0).toFixed(1)}ms, p(95)=${(v["p(95)"] || 0).toFixed(1)}ms, avg=${(v.avg || 0).toFixed(1)}ms, max=${(v.max || 0).toFixed(1)}ms`);
    }
  }
}

