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
      const val = trimmed.slice(idx + 1).trim();
      env[key] = val;
    }
  }
});

const url = env['NEXT_PUBLIC_SUPABASE_URL'];
const secretKey = env['SUPABASE_SECRET_KEY'];

async function testEndpoint() {
  const tables = ['merchants', 'customers', 'rewards', 'customer_visits', 'offers', 'push_tokens', 'notification_logs', 'nearby_offer_logs'];
  const results = {};

  for (const table of tables) {
    try {
      const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, {
        headers: {
          'apikey': secretKey,
          'Authorization': `Bearer ${secretKey}`
        }
      });
      if (res.status === 200) {
        results[table] = 'FOUND (200 OK)';
      } else {
        const body = await res.json();
        results[table] = `ERROR (${res.status}): ${body.message || body.error || JSON.stringify(body)}`;
      }
    } catch (err) {
      results[table] = `FETCH_ERROR: ${err.message}`;
    }
  }

  console.log(JSON.stringify(results, null, 2));
}

testEndpoint();

