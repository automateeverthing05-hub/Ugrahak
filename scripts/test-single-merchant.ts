import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

function parseEnv(filePath: string) {
  const content = fs.readFileSync(filePath, "utf-8");
  const env: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

const env = parseEnv(".env.staging.local");
const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY);

async function test() {
  const resWithCount = await client
    .from("merchants")
    .select("id, shop_name, phone, google_maps_url, slug, plan, customer_count")
    .eq("slug", "test-merchant-000001")
    .maybeSingle();
  console.log("Query with customer_count:", resWithCount);

  const resWithoutCount = await client
    .from("merchants")
    .select("id, shop_name, phone, google_maps_url, slug, plan")
    .eq("slug", "test-merchant-000001")
    .maybeSingle();
  console.log("Query without customer_count:", resWithoutCount);
}

test();

