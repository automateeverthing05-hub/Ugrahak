const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const idx = trimmed.indexOf('=');
    if (idx > -1) {
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
});

const url = env['NEXT_PUBLIC_SUPABASE_URL'];
const secretKey = env['SUPABASE_SECRET_KEY'];

console.log("==================================================");
console.log("ORIGINAL DATABASE AUDIT");
console.log("==================================================");
console.log("Supabase URL:", url);

async function runAudit() {
  const tables = [
    'merchants',
    'customers',
    'customer_visits',
    'rewards',
    'offers',
    'push_tokens',
    'notification_logs',
    'nearby_offer_logs',
    'scratch_card_rewards',
    'review_requests'
  ];

  console.log("\n--- Table Availability & Record Counts ---");
  for (const table of tables) {
    try {
      const res = await fetch(`${url}/rest/v1/${table}?select=count`, {
        headers: {
          'apikey': secretKey,
          'Authorization': `Bearer ${secretKey}`,
          'Range-Unit': 'items',
          'Prefer': 'count=exact'
        }
      });
      if (res.status === 200) {
        const countHeader = res.headers.get('content-range');
        const count = countHeader ? countHeader.split('/')[1] : 'unknown';
        console.log(`✓ Table '${table}': FOUND (${count} records)`);
      } else {
        const body = await res.json();
        console.log(`✗ Table '${table}': HTTP ${res.status} - ${JSON.stringify(body)}`);
      }
    } catch (err) {
      console.log(`✗ Table '${table}': ERROR - ${err.message}`);
    }
  }

  console.log("\n--- RPC / Function Audit ---");
  try {
    const rpcRes = await fetch(`${url}/rest/v1/rpc/process_customer_checkin`, {
      method: 'POST',
      headers: {
        'apikey': secretKey,
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        p_merchant_id: '00000000-0000-0000-0000-000000000000',
        p_customer_name: 'Audit Probe',
        p_phone: '0000000000'
      })
    });
    if (rpcRes.status === 200 || rpcRes.status === 400 || rpcRes.status === 404) {
      const rpcData = await rpcRes.json();
      console.log(`✓ RPC 'process_customer_checkin': FOUND (Response: HTTP ${rpcRes.status}, code: ${rpcData.code || 'OK'})`);
    } else {
      console.log(`! RPC 'process_customer_checkin' returned: HTTP ${rpcRes.status}`);
    }
  } catch (rpcErr) {
    console.log(`✗ RPC Check Error: ${rpcErr.message}`);
  }
}

runAudit();

