/**
 * Integration Test Suite: Merchant Offer Image Upload, Storage Isolation, and Retrieval
 */
import { createAdminClient } from "@/lib/supabase/admin";

async function runStorageAndOfferTests() {
  console.log("==================================================================");
  console.log("TESTING: Offer Image Upload & Storage Isolation Verification");
  console.log("==================================================================\n");

  const admin = createAdminClient();
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${desc}`);
      failed++;
    }
  }

  try {
    // 1. Verify Storage Bucket
    const { data: buckets, error: bErr } = await admin.storage.listBuckets();
    assert(!bErr && (buckets || []).some((b) => b.id === "offers" && b.public), "1. 'offers' bucket exists and is public");

    // 2. Fetch a real test merchant from DB
    const { data: merchant, error: mErr } = await admin
      .from("merchants")
      .select("id, shop_name")
      .limit(1)
      .single();

    assert(!mErr && !!merchant, `2. Found active test merchant: ${merchant?.shop_name} (${merchant?.id})`);
    if (!merchant) throw new Error("No merchant available for testing");

    // 3. Test isolated upload under merchant path
    const fakeImageBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG magic numbers
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    ]);
    const testFileName = `${merchant.id}/test_prod_${Date.now()}.png`;

    const { data: uploadData, error: uploadErr } = await admin.storage
      .from("offers")
      .upload(testFileName, fakeImageBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    assert(!uploadErr && !!uploadData?.path, "3. Uploaded test image to merchant-isolated folder");

    // 4. Test Public URL generation & HTTP access
    const { data: publicUrlData } = admin.storage
      .from("offers")
      .getPublicUrl(testFileName);

    assert(
      !!publicUrlData.publicUrl && publicUrlData.publicUrl.includes(merchant.id),
      "4. Generated public URL containing merchant path"
    );

    const httpRes = await fetch(publicUrlData.publicUrl);
    assert(httpRes.status === 200, `5. Public HTTP GET returns 200 OK (Content-Type: ${httpRes.headers.get("content-type")})`);

    // 5. Test Offer Creation with Image URL in Database
    const { data: createdOffer, error: offerErr } = await admin
      .from("offers")
      .insert({
        merchant_id: merchant.id,
        title: "Test Special Product Discount",
        message: "Exclusive offer on newly arrived items with product photo attached!",
        image_url: publicUrlData.publicUrl,
        status: "ACTIVE",
      })
      .select()
      .single();

    assert(!offerErr && !!createdOffer && createdOffer.image_url === publicUrlData.publicUrl, "6. Saved offer with product image URL in database");

    if (createdOffer) {
      // 6. Test Persistence and Fetch
      const { data: fetchedOffer, error: fetchErr } = await admin
        .from("offers")
        .select("*")
        .eq("id", createdOffer.id)
        .single();

      assert(
        !fetchErr && fetchedOffer?.image_url === publicUrlData.publicUrl,
        "7. Verified image URL persistence after database reload"
      );

      // 7. Cleanup test data
      await admin.from("offers").delete().eq("id", createdOffer.id);
    }
    await admin.storage.from("offers").remove([testFileName]);
    console.log("\n  🧹 Test offer and temporary image cleaned up successfully.");

  } catch (err: unknown) {
    console.error("Test execution failed:", err);
    failed++;
  }

  console.log(`\n==================================================================`);
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log(`==================================================================\n`);

  if (failed > 0) process.exit(1);
}

runStorageAndOfferTests();
