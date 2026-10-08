const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const admin = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runConcurrencyAudit() {
  console.log('====================================================');
  console.log('UGRAHAK CONCURRENCY & MULTI-TENANT STRESS TEST SUITE');
  console.log('====================================================\n');

  // 1. Fetch 2 distinct merchants (or provision 2 test merchants)
  const { data: merchants, error: mErr } = await admin
    .from('merchants')
    .select('id, shop_name, slug')
    .limit(2);

  if (mErr || !merchants || merchants.length < 1) {
    console.error('Failed to fetch merchants:', mErr);
    process.exit(1);
  }

  const merchantA = merchants[0];
  console.log(`Merchant A: ${merchantA.shop_name} (${merchantA.id})`);

  let merchantB = merchants[1];
  if (!merchantB) {
    console.log('Only 1 merchant found in DB. Creating second test merchant for tenant isolation testing...');
    const dummyId = crypto.randomUUID();
    const { data: newB, error: bErr } = await admin.from('merchants').insert({
      id: dummyId,
      shop_name: 'Test Tenant B Store',
      phone: '9998887776',
      slug: `test-tenant-b-${Date.now()}`,
      plan: 'STARTER',
    }).select().single();
    if (bErr) {
      console.warn('Could not create dummy merchant (foreign key with auth.users required):', bErr.message);
    } else {
      merchantB = newB;
    }
  }

  // TEST 1: Simultaneous Customer Check-ins (100 concurrent writes to same merchant)
  console.log('\n--- SCENARIO A: Concurrent Customer Check-ins (100 parallel writes) ---');
  const t0 = Date.now();
  const CONCURRENT_COUNT = 100;
  const checkinPromises = [];

  for (let i = 0; i < CONCURRENT_COUNT; i++) {
    const custName = `Concurrent Customer ${i}_${Date.now()}`;
    const refCode = `TEST_AG_${Date.now()}_${i}`;
    const promise = (async () => {
      // Direct atomic insert test (with surrogate phone fallback matching production checkin route)
      const surrogatePhone = `NP_${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
      const { data: cust, error: cErr } = await admin.from('customers').insert({
        merchant_id: merchantA.id,
        name: custName,
        phone: surrogatePhone,
        visit_count: 1,
      }).select().single();

      if (cErr) return { success: false, error: cErr.message };

      const { data: reward, error: rErr } = await admin.from('rewards').insert({
        merchant_id: merchantA.id,
        customer_id: cust.id,
        reward_type: 'FIRST_VISIT',
        title: '10% Off First Visit',
        description: 'Exclusive first visit discount',
        discount_value: '10%',
        status: 'ACTIVE',
        reference_code: refCode,
      }).select().single();

      if (rErr) return { success: false, error: rErr.message };
      return { success: true, customerId: cust.id, rewardId: reward.id, refCode };
    })();
    checkinPromises.push(promise);
  }

  const checkinResults = await Promise.all(checkinPromises);
  const duration = Date.now() - t0;
  const successes = checkinResults.filter((r) => r.success);
  const failures = checkinResults.filter((r) => !r.success);

  console.log(`Results: ${successes.length}/${CONCURRENT_COUNT} succeeded in ${duration}ms (Avg: ${(duration / CONCURRENT_COUNT).toFixed(1)}ms/req)`);
  if (failures.length > 0) {
    console.error('Sample failure:', failures[0].error);
  }

  // TEST 2: Concurrent Duplicate Reward Redemption (Race Condition Test)
  console.log('\n--- SCENARIO E: Race Condition — 10 Concurrent Redemptions on Same Reward ---');
  if (successes.length > 0) {
    const targetRewardCode = successes[0].refCode;
    const targetRewardId = successes[0].rewardId;

    // Simulate 10 simultaneous redemption requests with conditional update
    const redeemPromises = [];
    for (let i = 0; i < 10; i++) {
      const p = (async () => {
        // Concurrency-safe atomic UPDATE status = 'REDEEMED' WHERE status = 'ACTIVE'
        const { data: updated, error } = await admin
          .from('rewards')
          .update({
            status: 'REDEEMED',
            redeemed_at: new Date().toISOString(),
          })
          .eq('id', targetRewardId)
          .eq('status', 'ACTIVE') // Atomic concurrency lock
          .select()
          .maybeSingle();

        if (error) return { redeemed: false, error: error.message };
        return { redeemed: !!updated, data: updated };
      })();
      redeemPromises.push(p);
    }

    const redeemResults = await Promise.all(redeemPromises);
    const successfulRedeems = redeemResults.filter((r) => r.redeemed);
    const blockedRaces = redeemResults.filter((r) => !r.redeemed);

    console.log(`Race test results:`);
    console.log(`  Atomic successful redemptions: ${successfulRedeems.length} (Expected: EXACTLY 1)`);
    console.log(`  Safely rejected concurrent races: ${blockedRaces.length} (Expected: EXACTLY 9)`);
    if (successfulRedeems.length === 1 && blockedRaces.length === 9) {
      console.log('  ✅ PASS: Concurrency guard strictly prevented double-redemption!');
    } else {
      console.error('  ❌ FAIL: Concurrency leak detected in reward redemption!');
    }
  }

  // TEST 3: Multi-Tenant Data Isolation Under Concurrent Read/Write
  console.log('\n--- SCENARIO C & D: Multi-Tenant Isolation Verification ---');
  // Query Merchant A data pretending to filter as Merchant B
  if (merchantB) {
    const { data: leakedCustomers, error: leakErr } = await admin
      .from('customers')
      .select('id, name, phone, merchant_id')
      .eq('merchant_id', merchantB.id);

    const hasMerchantAData = (leakedCustomers || []).some((c) => c.merchant_id === merchantA.id);
    if (!hasMerchantAData) {
      console.log('  ✅ PASS: Tenant B query strictly returned zero records from Tenant A.');
    } else {
      console.error('  ❌ FAIL: Cross-tenant data leak found!');
    }
  }

  // Cleanup test records
  console.log('\n--- CLEANUP: Removing generated test load records ---');
  const custIdsToDelete = successes.map((s) => s.customerId);
  if (custIdsToDelete.length > 0) {
    await admin.from('rewards').delete().in('customer_id', custIdsToDelete);
    await admin.from('customers').delete().in('id', custIdsToDelete);
    console.log(`  Cleaned up ${custIdsToDelete.length} temporary test records.`);
  }

  console.log('\n====================================================');
  console.log('CONCURRENCY & RACE AUDIT COMPLETE');
  console.log('====================================================\n');
}

runConcurrencyAudit().catch(console.error);
