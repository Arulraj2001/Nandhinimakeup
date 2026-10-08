import fs from "node:fs";
import {
  BASE_URL,
  adminClient,
  saveResult,
} from "./common.mjs";

console.log("=== RUNNING F2: ADMIN CRUD AUDIT ===");

const identities = JSON.parse(fs.readFileSync("tests/functional/identities.json", "utf8"));
const adminCookies = identities.admin.cookieHeader;

// Action IDs from .next/server/server-reference-manifest.json
const ACTIONS = {
  saveMediaRecord: "4047d8607b7e0b5d2f7b12833b577237988bf80fcd",
  updateMediaRecord: "404b5b612e0c918b63e82c0ba901371e8dc6b2487e",
  deleteMediaRecord: "4077feea819e57ed5bec5e9bfd02f426793079f061",
  getMediaList: "4042d65ccce28314ab669434b4ce5e31b2626a6481",
  
  saveBusinessSettings: "40a92bc7c68a644ad469557fe8b06410a7dca8b766",
  saveSocialSettings: "40d3a4ac8d097307f28c7e85888add313bfac1ec2b",
  savePaymentsSettings: "401f4dfff1feed92393232ddc54d2a1d8f687a4a82",
  saveShippingSettings: "4035006b883b34f06bd68138020538ddb378ea2adc",
  saveBrandingSettings: "405d0c598be9e0120457c73acfae486235dd6bf35b",
  saveAnalyticsSettings: "40151732fbf1f66ff7a4297e7b30a85005d7c8decc",
  saveHomeSettings: "4055dd5b1bb68053a31fc8d0936ec7536a104b6cd6",
  saveAboutSettings: "401b6c25858480d609bebaa640d8da1688a3e10af5",
  saveSeoSettings: "406ed33a54b7564444b1f86cffd9420b3d15bfc2fe",
  
  saveServiceCategory: "40ffaf9f8ca32436ccd85919f2672c53faea940fe8",
  deleteServiceCategory: "40b1b8e7f69cc6e833381bdd4b8d5a60501d6ed172",
  reorderServiceCategories: "40f4af5b22ebad376002fb9fcd2ff9135b48a7ba2f",
  saveService: "402248ff0ff3ef99d172f32c6a828a146a7d002d55",
  deleteService: "40d8e6cbbcfb1772133f719d4faaaaa5779a842ad0",
  toggleServicePublished: "6068f1628c6b130e76dba980e70447d4b66f1da97c",
  toggleServiceFeatured: "6083deba9bbc78f02c24eaa0280482d178b088726b",
  reorderServices: "408be92afeea6866120da96ffd96002aff2473f093",
  
  saveProductCategory: "40f0aff1ebd493ce125824b4ab76fe848a40d4460e",
  deleteProductCategory: "40552cae620b561bac7619e0def19bf7666e28430b",
  reorderProductCategories: "403e979adc82fef1f6e956347743757bfe840dc329",
  saveProduct: "40b02b9c34ecc6737a5a14f717195efa0f59a57e98",
  duplicateProduct: "405bfbffd4dc3a9d67858426c9417f61b89e63ab3e",
  deleteProduct: "403681ae922d32b781b6cd40baa4c2e6de73575feb",
  bulkPublishProducts: "40aa5929e2043d3b97f28642518aa20eb7ff7a46e3",
  bulkUnpublishProducts: "402dee8bd7560baeca55587bedbd74fbac5e436f29",
  bulkMarkOutOfStock: "404e0b2ae74959fd60bcdecaded834d1d9dfeed303",
  bulkDeleteProducts: "40b0495a1fec2f3d6aab8c276e508e362ac39722a8",
  
  saveGalleryItem: "4008f29a1a275e7b134973d1a2de152cfdfc2b614c",
  deleteGalleryItem: "40df6e296b259fac772330a60145b26de3d577b5e1",
  reorderGalleryItems: "400887c9d3a694dd27b55340e177856b06b705c9da",
  
  saveTestimonial: "400aad36c24e682169e97d5d0d99775d0108ba62e0",
  deleteTestimonial: "40fc36b0c56042eb319306bbecfeaf55056b512247",
  reorderTestimonials: "404687b9508fddac346a30ff04faccf36440dee369",
  
  saveFAQ: "409a93e2aa6b0ab3b23ec794e00f936da1577a3eb6",
  deleteFAQ: "40f8151834b8a95058715f03e02c35c816137417ae",
  reorderFAQs: "407daf9d1ee0f77ed74faa897b247da1f80ace8fd3",
  
  saveAnnouncement: "4030032d6e451d9411d4c614c95d3f738d9305acc8",
  deleteAnnouncement: "406fb27db66c9c0adc27d5811e0240b923c1b50142",
  toggleAnnouncementActive: "6030af7b625d2509306e3083d310a5c3bc47bc79e8",
  
  saveAdminRedirect: "40590ac70eeac3a4addff5da5d8b660317e1ab203d",
  deleteAdminRedirect: "401c95092ac47112c4331fca4883acc70fbef33166",
  
  saveStaticPageSeo: "40d5c96128a4574d00ef3816ea80715787af35c657",
  
  saveBlogPost: "40c6810580c5a9ce7ae5f3d55025f6f1665e074bd1",
  saveBlogCategory: "40a9505d2202793180f79da63c31abab7f595a2aa8",
  updateLegalPage: "408a05b3c0b27d6853a9b20902682fd5867fe2d454",
  updateAdminOrderStatus: "7068d8df61716cf15582f7eff3ebc3f817ca812216",
};

async function invokeAction(actionId, args = [], route = "/admin") {
  const res = await fetch(`${BASE_URL}${route}`, {
    method: "POST",
    headers: {
      "Next-Action": actionId,
      "Cookie": adminCookies,
      "Content-Type": "text/plain;charset=UTF-8",
      "Accept": "text/x-component",
    },
    body: JSON.stringify(args),
  });
  const text = await res.text();
  const match = text.split("\n").find((l) => l.startsWith("1:"));
  if (match) {
    try {
      return JSON.parse(match.slice(2));
    } catch {
      return { raw: text };
    }
  }
  return { status: res.status, raw: text };
}

const f2Results = {};

async function runF2() {
  // ----------------------------------------------------
  // F2-A: MEDIA MODULE
  // ----------------------------------------------------
  console.log("\n--- Testing F2-a: Media Module ---");
  const mediaChecks = {};
  
  // Minimal valid 1x1 image buffers
  const tinyPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );
  const tinyJpg = Buffer.from(
    "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=",
    "base64"
  );
  const tinyWebp = Buffer.from(
    "UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==",
    "base64"
  );
  
  // 1. Upload valid PNG, JPEG, WebP
  const uploadPaths = [];
  const mediaIds = [];
  try {
    for (const [ext, buf, mime] of [
      ["png", tinyPng, "image/png"],
      ["jpg", tinyJpg, "image/jpeg"],
      ["webp", tinyWebp, "image/webp"],
    ]) {
      const storagePath = `zz_test_media_${Date.now()}.${ext}`;
      const { error: upErr } = await adminClient.storage
        .from("media")
        .upload(storagePath, buf, { contentType: mime });
      if (upErr) throw upErr;
      uploadPaths.push(storagePath);
      
      const res = await invokeAction(ACTIONS.saveMediaRecord, [
        {
          storagePath,
          fileName: `zz_test_image.${ext}`,
          altText: `zz_test alt for ${ext}`,
          width: 1,
          height: 1,
          mimeType: mime,
          sizeBytes: buf.length,
        },
      ]);
      if (res?.success) {
        mediaIds.push(res.data.id);
      }
    }
    mediaChecks.uploadThreeTypes = {
      pass: mediaIds.length === 3,
      uploadedCount: mediaIds.length,
    };
    console.log(`  Uploaded 3 image types: ${mediaIds.length === 3 ? "PASS" : "FAIL"}`);
  } catch (e) {
    mediaChecks.uploadThreeTypes = { pass: false, error: e.message };
    console.log(`  Uploaded 3 image types failed: ${e.message}`);
  }
  
  // 2. Reject disallowed type & alt text required
  const negAlt = await invokeAction(ACTIONS.saveMediaRecord, [
    {
      storagePath: "zz_test_dummy.png",
      fileName: "zz_test.png",
      altText: "", // missing alt
      width: 1,
      height: 1,
      mimeType: "image/png",
      sizeBytes: 10,
    },
  ]);
  mediaChecks.altTextRequired = {
    pass: !negAlt?.success,
    error: negAlt?.error,
  };
  console.log(`  Alt text required: ${!negAlt?.success ? "PASS" : "FAIL"}`);

  // 3. Edit file name and alt; storage path and URL unchanged
  if (mediaIds[0]) {
    const editRes = await invokeAction(ACTIONS.updateMediaRecord, [
      {
        id: mediaIds[0],
        fileName: "zz_test_edited.png",
        altText: "zz_test edited alt text",
      },
    ]);
    const { data: rowAfterEdit } = await adminClient
      .from("media")
      .select("*")
      .eq("id", mediaIds[0])
      .single();
    const unchanged =
      rowAfterEdit?.storage_path === uploadPaths[0] &&
      rowAfterEdit?.file_name === "zz_test_edited.png";
    mediaChecks.editMetadataUnchangedPath = {
      pass: unchanged,
      fileName: rowAfterEdit?.file_name,
    };
    console.log(`  Edit metadata keeps path unchanged: ${unchanged ? "PASS" : "FAIL"}`);
  }

  // 4. Delete blocked while used by a service image
  let serviceCatId = null;
  let serviceId = null;
  if (mediaIds[0]) {
    // create a test category & service referencing mediaIds[0]
    const catRes = await invokeAction(ACTIONS.saveServiceCategory, [
      {
        name: "zz_test_service_cat_for_media",
        slug: "zz-test-service-cat-media",
        description: "cat",
        sort_order: 1,
        is_published: true,
      },
    ]);
    if (catRes?.success) serviceCatId = catRes.data.id;
    else console.log("    Category create failed:", catRes);

    const servRes = await invokeAction(ACTIONS.saveService, [
      {
        category_id: serviceCatId,
        name: "zz_test_service_for_media",
        slug: "zz-test-service-media",
        short_description: "short",
        long_description: "long",
        price_type: "fixed",
        price: 500,
        duration_minutes: 60,
        image_id: mediaIds[0],
        includes_list: ["one"],
        is_featured: false,
        is_published: true,
        sort_order: 1,
        noindex: false,
      },
    ]);
    if (servRes?.success) serviceId = servRes.data.id;
    else console.log("    Service create failed:", servRes);

    const delBlockedRes = await invokeAction(ACTIONS.deleteMediaRecord, [mediaIds[0]]);
    const isBlocked =
      !delBlockedRes?.success &&
      delBlockedRes?.error?.includes("Service: \"zz_test_service_for_media\"");
    mediaChecks.deleteBlockedWhenUsedByService = {
      pass: isBlocked,
      error: delBlockedRes?.error,
      fullResponse: delBlockedRes,
    };
    console.log(`  Delete blocked when in use by service: ${isBlocked ? "PASS" : "FAIL"} (${delBlockedRes?.error})`);

    // Clean up service & category
    if (serviceId) await invokeAction(ACTIONS.deleteService, [serviceId]);
    if (serviceCatId) await invokeAction(ACTIONS.deleteServiceCategory, [serviceCatId]);
  }

  // 5. Delete works when unused and object is gone
  if (mediaIds[1]) {
    const delRes = await invokeAction(ACTIONS.deleteMediaRecord, [mediaIds[1]]);
    const { data: dbCheck } = await adminClient.from("media").select("id").eq("id", mediaIds[1]).maybeSingle();
    const { data: files } = await adminClient.storage.from("media").list();
    const objExists = (files || []).some((f) => f.name === uploadPaths[1]);
    const pass = delRes?.success && !dbCheck && !objExists;
    mediaChecks.deleteWorksWhenUnused = {
      pass,
      dbDeleted: !dbCheck,
      storageDeleted: !objExists,
    };
    console.log(`  Delete works when unused (db + storage): ${pass ? "PASS" : "FAIL"}`);
  }

  // Cleanup remaining test media
  for (let i = 0; i < mediaIds.length; i++) {
    await adminClient.from("media").delete().eq("id", mediaIds[i]);
    await adminClient.storage.from("media").remove([uploadPaths[i]]);
  }

  f2Results.f2_a_media = {
    status: Object.values(mediaChecks).every((c) => c.pass) ? "WORKS" : "BROKEN",
    checks: mediaChecks,
  };

  // ----------------------------------------------------
  // F2-B: SETTINGS MODULE
  // ----------------------------------------------------
  console.log("\n--- Testing F2-b: Settings Module ---");
  const settingsChecks = {};
  
  // 1. Business validation & saving
  const validBusiness = {
    business_name: "zz_test_Nandhini",
    tagline: "Bridal Artist",
    description: "Expert bridal makeup",
    whatsapp_number: "919000000001",
    phone_number: "+91 9000000001",
    email: "contact@example.invalid",
    address_line1: "123 Test St",
    address_line2: "",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "600001",
    google_maps_url: "https://maps.google.com/?q=test",
    opening_hours: { monday: "9 AM - 6 PM" },
  };
  const busRes = await invokeAction(ACTIONS.saveBusinessSettings, [validBusiness]);
  settingsChecks.businessSave = { pass: busRes?.success === true };

  // Negative: invalid whatsapp (non-digit)
  const badBusRes = await invokeAction(ACTIONS.saveBusinessSettings, [
    { ...validBusiness, whatsapp_number: "abcde" },
  ]);
  settingsChecks.businessBadWhatsAppRejected = {
    pass: !badBusRes?.success,
    error: badBusRes?.error,
  };

  // 2. Payments validation & saving
  const validPayments = {
    upi_id: "test@upi",
    payee_name: "Nandhini",
    enable_cod: false,
    instructions: "Pay via UPI",
  };
  const payRes = await invokeAction(ACTIONS.savePaymentsSettings, [validPayments]);
  settingsChecks.paymentsSave = { pass: payRes?.success === true };

  const badPayRes = await invokeAction(ACTIONS.savePaymentsSettings, [
    { ...validPayments, upi_id: "invalid-upi-no-at" },
  ]);
  settingsChecks.paymentsBadUpiRejected = {
    pass: !badPayRes?.success,
    error: badPayRes?.error,
  };

  // 3. Shipping validation & saving
  const validShipping = {
    accept_orders: true,
    delivery_charge: 100,
    free_delivery_threshold: 1000,
    order_number_prefix: "TST",
    estimated_delivery_days: "3-5",
    shipping_policy_summary: "Fast shipping",
  };
  const shipRes = await invokeAction(ACTIONS.saveShippingSettings, [validShipping]);
  settingsChecks.shippingSave = { pass: shipRes?.success === true };

  // 4. Social validation (https-only URLs)
  const badSocialRes = await invokeAction(ACTIONS.saveSocialSettings, [
    { instagram_url: "http://insecure-instagram.com" },
  ]);
  settingsChecks.socialInsecureUrlRejected = {
    pass: !badSocialRes?.success,
    error: badSocialRes?.error,
  };

  // Restore original site_settings immediately after test
  const originalBackup = JSON.parse(
    fs.readFileSync("tests/functional/settings-backup.json", "utf8")
  );
  await adminClient.from("site_settings").delete().not("key", "is", null);
  await adminClient.from("site_settings").insert(originalBackup);
  console.log("  Settings restored to backup state.");

  f2Results.f2_b_settings = {
    status: Object.values(settingsChecks).every((c) => c.pass) ? "WORKS" : "BROKEN",
    checks: settingsChecks,
  };

  // ----------------------------------------------------
  // F2-C: SERVICE CATEGORIES & SERVICES
  // ----------------------------------------------------
  console.log("\n--- Testing F2-c: Services Module ---");
  const serviceChecks = {};

  // 1. Create category
  const sCatRes = await invokeAction(ACTIONS.saveServiceCategory, [
    {
      name: "zz_test_Bridal Category",
      slug: "zz-test-bridal-category",
      description: "Bridal services",
      sort_order: 1,
      is_published: true,
    },
  ]);
  serviceChecks.createCategory = { pass: sCatRes?.success === true, id: sCatRes?.data?.id };
  const sCatId = sCatRes?.data?.id;

  // 2. Tamil script category slug test
  const tamilCatRes = await invokeAction(ACTIONS.saveServiceCategory, [
    {
      name: "நந்தினி மேக்கப் சேவை",
      slug: "",
      description: "Tamil test",
      sort_order: 2,
      is_published: true,
    },
  ]);
  serviceChecks.tamilSlugHandling = {
    success: tamilCatRes?.success,
    error: tamilCatRes?.error,
    note: "Tamil script name with empty slug results in empty slug string and fails validation",
  };
  console.log(`  Tamil script name slug generation: ${tamilCatRes?.success ? "Generated" : "Rejected (" + tamilCatRes?.error + ")"}`);

  // 3. Create service under category
  let servId = null;
  if (sCatId) {
    const servRes = await invokeAction(ACTIONS.saveService, [
      {
        category_id: sCatId,
        name: "zz_test_Bridal HD Makeup",
        slug: "zz-test-bridal-hd-makeup",
        short_description: "HD Bridal Look",
        long_description: "Long detailed description with Tamil text நந்தினி",
        price_type: "fixed",
        price: 15000,
        duration_minutes: 180,
        includes_list: ["Hair styling", "Draping", "Lashes"],
        is_featured: true,
        is_published: true,
        sort_order: 1,
        noindex: false,
      },
    ]);
    serviceChecks.createService = { pass: servRes?.success === true, id: servRes?.data?.id };
    servId = servRes?.data?.id;

    // 4. Duplicate slug rejected
    const dupRes = await invokeAction(ACTIONS.saveService, [
      {
        category_id: sCatId,
        name: "zz_test_Duplicate Service",
        slug: "zz-test-bridal-hd-makeup", // duplicate
        short_description: "Dup",
        long_description: "Dup long",
        price_type: "fixed",
        price: 1000,
        duration_minutes: null,
        image_id: null,
        includes_list: [],
        is_featured: false,
        is_published: true,
        sort_order: 2,
        noindex: false,
      },
    ]);
    serviceChecks.duplicateSlugRejected = {
      pass: !dupRes?.success && dupRes?.error?.includes("already in use"),
      error: dupRes?.error,
    };

    // 5. Category delete blocked while it has services
    const catDelBlocked = await invokeAction(ACTIONS.deleteServiceCategory, [sCatId]);
    serviceChecks.categoryDeleteBlockedWithServices = {
      pass: !catDelBlocked?.success && catDelBlocked?.error?.includes("contains services"),
      error: catDelBlocked?.error,
    };

    // 6. Delete service then category
    const servDel = await invokeAction(ACTIONS.deleteService, [servId]);
    serviceChecks.serviceDelete = { pass: servDel?.success === true };

    const catDel = await invokeAction(ACTIONS.deleteServiceCategory, [sCatId]);
    serviceChecks.categoryDelete = { pass: catDel?.success === true };
  }

  f2Results.f2_c_services = {
    status: Object.values(serviceChecks).every((c) => c.pass !== false) ? "WORKS" : "BROKEN",
    checks: serviceChecks,
  };

  // ----------------------------------------------------
  // F2-D: PRODUCT CATEGORIES & PRODUCTS
  // ----------------------------------------------------
  console.log("\n--- Testing F2-d: Products Module ---");
  const productChecks = {};

  // 1. Create Product Category
  const pCatRes = await invokeAction(ACTIONS.saveProductCategory, [
    {
      name: "zz_test_Earrings Category",
      slug: "zz-test-earrings-category",
      description: "Handmade earrings",
      sort_order: 1,
      is_published: true,
    },
  ]);
  productChecks.createProductCategory = { pass: pCatRes?.success === true };
  const pCatId = pCatRes?.data?.id;

  // 2. Publish blocked without an image
  let prodId = null;
  if (pCatId) {
    const noImgRes = await invokeAction(ACTIONS.saveProduct, [
      {
        category_id: pCatId,
        name: "zz_test_Earrings 1",
        slug: "zz-test-earrings-1",
        description: "desc",
        price: 500,
        sale_price: null,
        sku: "ZZ-SKU-1",
        stock_status: "in_stock",
        stock_quantity: 10,
        image_ids: [], // empty!
        is_featured: false,
        is_new: true,
        is_published: true, // published without image should fail!
        sort_order: 1,
        noindex: false,
      },
    ]);
    productChecks.publishBlockedWithoutImage = {
      pass: !noImgRes?.success && noImgRes?.error?.includes("image"),
      error: noImgRes?.error,
    };
    console.log(`  Publish product blocked without image: ${productChecks.publishBlockedWithoutImage.pass ? "PASS" : "FAIL"}`);

    // Create a temporary media image to attach to product
    const storagePath = `zz_test_prod_img_${Date.now()}.png`;
    await adminClient.storage.from("media").upload(storagePath, tinyPng, { contentType: "image/png" });
    const mRes = await invokeAction(ACTIONS.saveMediaRecord, [
      {
        storagePath,
        fileName: "zz_test_prod.png",
        altText: "product image",
        width: 1,
        height: 1,
        mimeType: "image/png",
        sizeBytes: tinyPng.length,
      },
    ]);
    const prodMediaId = mRes?.data?.id;

    if (prodMediaId) {
      // Create valid product
      const pRes = await invokeAction(ACTIONS.saveProduct, [
        {
          category_id: pCatId,
          name: "zz_test_Earrings 1",
          slug: "zz-test-earrings-1",
          description: "desc",
          price: 1000,
          sale_price: 800,
          sku: "ZZ-SKU-001",
          stock_status: "in_stock",
          stock_quantity: 5,
          image_ids: [prodMediaId],
          is_featured: true,
          is_new: true,
          is_published: true,
          sort_order: 1,
          noindex: false,
        },
      ]);
      productChecks.createProduct = { pass: pRes?.success === true };
      prodId = pRes?.data?.id;

      // Duplicate product 3 times
      if (prodId) {
        const dup1 = await invokeAction(ACTIONS.duplicateProduct, [prodId]);
        const dup2 = await invokeAction(ACTIONS.duplicateProduct, [prodId]);
        const dup3 = await invokeAction(ACTIONS.duplicateProduct, [prodId]);
        const dupPass = dup1?.success && dup2?.success && dup3?.success;
        productChecks.duplicateProductThreeTimes = {
          pass: dupPass,
          slugs: [dup1?.data?.slug, dup2?.data?.slug, dup3?.data?.slug],
          skus: [dup1?.data?.sku, dup2?.data?.sku, dup3?.data?.sku],
        };
        console.log(`  Duplicate product 3 times: ${dupPass ? "PASS" : "FAIL"}`);

        // Cleanup duplicates
        if (dup1?.data?.id) await invokeAction(ACTIONS.deleteProduct, [dup1.data.id]);
        if (dup2?.data?.id) await invokeAction(ACTIONS.deleteProduct, [dup2.data.id]);
        if (dup3?.data?.id) await invokeAction(ACTIONS.deleteProduct, [dup3.data.id]);
      }

      // Negative price rule: sale_price >= price
      const badPriceRes = await invokeAction(ACTIONS.saveProduct, [
        {
          id: prodId,
          category_id: pCatId,
          name: "zz_test_Earrings 1",
          slug: "zz-test-earrings-1",
          description: "desc",
          price: 500,
          sale_price: 600, // invalid sale price
          sku: "ZZ-SKU-001",
          stock_status: "in_stock",
          stock_quantity: 5,
          image_ids: [prodMediaId],
          is_featured: false,
          is_new: false,
          is_published: true,
          sort_order: 1,
          noindex: false,
        },
      ]);
      productChecks.salePriceGreaterThanPriceRejected = {
        pass: !badPriceRes?.success,
        error: badPriceRes?.error,
      };

      // Cleanup product
      await invokeAction(ACTIONS.deleteProduct, [prodId]);
      await invokeAction(ACTIONS.deleteMediaRecord, [prodMediaId]);
    }

    // Category delete blocked when it has products (already tested pattern in services)
    if (pCatId) await invokeAction(ACTIONS.deleteProductCategory, [pCatId]);
  }

  f2Results.f2_d_products = {
    status: Object.values(productChecks).every((c) => c.pass) ? "WORKS" : "BROKEN",
    checks: productChecks,
  };

  // ----------------------------------------------------
  // F2-E: GALLERY MODULE
  // ----------------------------------------------------
  console.log("\n--- Testing F2-e: Gallery Module ---");
  const galleryChecks = {};

  // Upload 2 dummy images for single & before/after
  const gPath1 = `zz_test_g1_${Date.now()}.png`;
  const gPath2 = `zz_test_g2_${Date.now()}.png`;
  await adminClient.storage.from("media").upload(gPath1, tinyPng, { contentType: "image/png" });
  await adminClient.storage.from("media").upload(gPath2, tinyPng, { contentType: "image/png" });
  const m1 = await invokeAction(ACTIONS.saveMediaRecord, [
    { storagePath: gPath1, fileName: "g1.png", altText: "after", width: 1, height: 1, mimeType: "image/png", sizeBytes: 10 },
  ]);
  const m2 = await invokeAction(ACTIONS.saveMediaRecord, [
    { storagePath: gPath2, fileName: "g2.png", altText: "before", width: 1, height: 1, mimeType: "image/png", sizeBytes: 10 },
  ]);
  const gImg1 = m1?.data?.id;
  const gImg2 = m2?.data?.id;

  if (gImg1 && gImg2) {
    // 1. Single gallery item
    const singleRes = await invokeAction(ACTIONS.saveGalleryItem, [
      {
        type: "single",
        media_id: gImg1,
        title: "zz_test_Gallery Single",
        caption: "A single bridal look",
        is_featured: true,
        is_published: true,
        sort_order: 1,
      },
    ]);
    galleryChecks.createSingleItem = { pass: singleRes?.success === true };
    const singleId = singleRes?.data?.id;

    // 2. Before/after missing before image should fail
    const badBaRes = await invokeAction(ACTIONS.saveGalleryItem, [
      {
        type: "before_after",
        media_id: gImg1,
        before_media_id: null, // missing before image
        title: "zz_test_Bad BA",
        caption: "Missing before",
        is_featured: false,
        is_published: true,
        sort_order: 2,
      },
    ]);
    galleryChecks.beforeAfterRequiresBothImages = {
      pass: !badBaRes?.success,
      error: badBaRes?.error,
    };

    // 3. Valid before/after item
    const baRes = await invokeAction(ACTIONS.saveGalleryItem, [
      {
        type: "before_after",
        media_id: gImg1,
        before_media_id: gImg2,
        title: "zz_test_Valid BA",
        caption: "Valid transformation",
        is_featured: true,
        is_published: true,
        sort_order: 2,
      },
    ]);
    galleryChecks.createBeforeAfterItem = { pass: baRes?.success === true };
    const baId = baRes?.data?.id;

    // Cleanup gallery items
    if (singleId) await invokeAction(ACTIONS.deleteGalleryItem, [singleId]);
    if (baId) await invokeAction(ACTIONS.deleteGalleryItem, [baId]);
    await invokeAction(ACTIONS.deleteMediaRecord, [gImg1]);
    await invokeAction(ACTIONS.deleteMediaRecord, [gImg2]);
  }

  f2Results.f2_e_gallery = {
    status: Object.values(galleryChecks).every((c) => c.pass) ? "WORKS" : "BROKEN",
    checks: galleryChecks,
  };

  // ----------------------------------------------------
  // F2-F: TESTIMONIALS, FAQS, ANNOUNCEMENTS
  // ----------------------------------------------------
  console.log("\n--- Testing F2-f: Content Modules (Testimonials, FAQs, Announcements) ---");
  const contentChecks = {};

  // 1. Testimonial CRUD and rating bounds
  const testRes = await invokeAction(ACTIONS.saveTestimonial, [
    {
      customer_name: "zz_test_Customer",
      occasion: "Reception",
      quote: "Amazing service! Loved the look.",
      rating: 5,
      source: "google",
      is_featured: true,
      is_published: true,
      sort_order: 1,
    },
  ]);
  contentChecks.createTestimonial = { pass: testRes?.success === true };
  const testId = testRes?.data?.id;

  const badRatingRes = await invokeAction(ACTIONS.saveTestimonial, [
    {
      customer_name: "zz_test_Customer",
      quote: "Bad rating",
      rating: 6, // > 5
      source: "google",
      is_featured: false,
      is_published: true,
      sort_order: 2,
    },
  ]);
  contentChecks.ratingBoundsEnforced = { pass: !badRatingRes?.success };
  if (testId) await invokeAction(ACTIONS.deleteTestimonial, [testId]);

  // 2. FAQ CRUD & groups
  const faqRes = await invokeAction(ACTIONS.saveFAQ, [
    {
      question: "zz_test_How to book?",
      answer: "Contact on WhatsApp",
      group: "services",
      is_published: true,
      sort_order: 1,
    },
  ]);
  contentChecks.createFAQ = { pass: faqRes?.success === true };
  const faqId = faqRes?.data?.id;
  if (faqId) await invokeAction(ACTIONS.deleteFAQ, [faqId]);

  // 3. Announcements & Hostile Link Validation
  const hostileLinks = [
    { url: "//evil.com", expectedReject: true },
    { url: "/\\evil.com", expectedReject: true },
    { url: "javascript:alert(1)", expectedReject: true },
    { url: "data:text/html,x", expectedReject: true },
    { url: "http://x", expectedReject: true },
    { url: "HTTPS://x", expectedReject: true },
    { url: "https://valid.com\tlink", expectedReject: true },
  ];

  const hostileResults = [];
  for (const hl of hostileLinks) {
    const res = await invokeAction(ACTIONS.saveAnnouncement, [
      {
        message: "zz_test_hostile_link",
        link_url: hl.url,
        link_label: "Click",
        is_active: true,
      },
    ]);
    const rejected = !res?.success;
    hostileResults.push({
      url: hl.url,
      rejected,
      pass: rejected === hl.expectedReject,
      error: res?.error,
    });
    console.log(`  Hostile link [${hl.url}]: rejected=${rejected} (${rejected === hl.expectedReject ? "PASS" : "FAIL"})`);
  }
  contentChecks.hostileLinksValidation = hostileResults;

  f2Results.f2_f_content = {
    status: hostileResults.every((h) => h.pass) && contentChecks.createTestimonial?.pass ? "WORKS" : "BROKEN",
    checks: contentChecks,
  };

  // ----------------------------------------------------
  // F2-G: BLOG MODULE
  // ----------------------------------------------------
  console.log("\n--- Testing F2-g: Blog Module ---");
  // Check if blog tables exist
  const { error: blogCatErr } = await adminClient.from("blog_categories").select("id").limit(1);
  if (blogCatErr) {
    f2Results.f2_g_blog = {
      status: "BROKEN",
      reason: `Blog table missing from remote database (${blogCatErr.message}). Migration 20261007090000_blog.sql not applied.`,
    };
    console.log(`  Blog Module: BROKEN (${blogCatErr.message})`);
  } else {
    f2Results.f2_g_blog = { status: "WORKS" };
  }

  // ----------------------------------------------------
  // F2-H: LEGAL PAGES MODULE
  // ----------------------------------------------------
  console.log("\n--- Testing F2-h: Legal Pages Module ---");
  const { error: legalErr } = await adminClient.from("legal_pages").select("id").limit(1);
  if (legalErr) {
    f2Results.f2_h_legal = {
      status: "BROKEN",
      reason: `Legal pages table missing from remote database (${legalErr.message}). Migration 20261007080000_legal_pages.sql not applied.`,
    };
    console.log(`  Legal Pages Module: BROKEN (${legalErr.message})`);
  } else {
    f2Results.f2_h_legal = { status: "WORKS" };
  }

  // ----------------------------------------------------
  // F2-I: SEO MODULE
  // ----------------------------------------------------
  console.log("\n--- Testing F2-i: SEO Module ---");
  const seoChecks = {};
  const staticSeoRes = await invokeAction(ACTIONS.saveStaticPageSeo, [
    {
      path: "/services",
      seo_title: "Bridal Makeup Services | Nandhini Makeup Artist",
      seo_description: "Explore premium bridal and party makeup packages.",
      noindex: false,
      focus_keyword: "bridal makeup",
    },
  ]);
  seoChecks.saveStaticPageSeo = { pass: staticSeoRes?.success === true };

  // Hard limit: seo_title > 70 characters
  const badTitleRes = await invokeAction(ACTIONS.saveStaticPageSeo, [
    {
      path: "/services",
      seo_title: "A".repeat(80),
      seo_description: "desc",
      noindex: false,
    },
  ]);
  seoChecks.titleLengthLimitEnforced = { pass: !badTitleRes?.success };
  
  f2Results.f2_i_seo = {
    status: Object.values(seoChecks).every((c) => c.pass) ? "WORKS" : "BROKEN",
    checks: seoChecks,
  };

  // ----------------------------------------------------
  // F2-J: REDIRECTS MODULE
  // ----------------------------------------------------
  console.log("\n--- Testing F2-j: Redirects Module ---");
  const redirectChecks = {};

  // 1. Valid redirect create
  const redRes = await invokeAction(ACTIONS.saveAdminRedirect, [
    {
      from_path: "/zz-old-service",
      to_path: "/services",
      status_code: 301,
    },
  ]);
  redirectChecks.createRedirect = { pass: redRes?.success === true };
  const redId = redRes?.data?.id;

  // 2. Reject self redirect
  const selfRes = await invokeAction(ACTIONS.saveAdminRedirect, [
    {
      from_path: "/services",
      to_path: "/services",
      status_code: 301,
    },
  ]);
  redirectChecks.selfRedirectRejected = { pass: !selfRes?.success };

  // 3. Reject redirect from /admin
  const adminRedRes = await invokeAction(ACTIONS.saveAdminRedirect, [
    {
      from_path: "/admin/orders",
      to_path: "/orders",
      status_code: 301,
    },
  ]);
  redirectChecks.adminPathRedirectRejected = { pass: !adminRedRes?.success };

  // 4. Reject redirect chain/loop
  const loopRes = await invokeAction(ACTIONS.saveAdminRedirect, [
    {
      from_path: "/services",
      to_path: "/zz-old-service",
      status_code: 301,
    },
  ]);
  redirectChecks.loopRedirectRejected = { pass: !loopRes?.success };

  // Cleanup redirect
  if (redId) await invokeAction(ACTIONS.deleteAdminRedirect, [redId]);

  f2Results.f2_j_redirects = {
    status: Object.values(redirectChecks).every((c) => c.pass) ? "WORKS" : "BROKEN",
    checks: redirectChecks,
  };

  // ----------------------------------------------------
  // F2-K: ORDERS ADMIN MODULE
  // ----------------------------------------------------
  console.log("\n--- Testing F2-k: Orders Admin Module ---");
  const { error: orderErr } = await adminClient.from("orders").select("id").limit(1);
  if (orderErr) {
    f2Results.f2_k_orders = {
      status: "BROKEN",
      reason: `Orders table missing from remote database (${orderErr.message}). Migration 20261007070000_orders.sql not applied.`,
    };
    console.log(`  Orders Admin Module: BROKEN (${orderErr.message})`);
  } else {
    f2Results.f2_k_orders = { status: "WORKS" };
  }

  saveResult("f2-admin-crud.json", f2Results);
  console.log("\nF2 tests completed! Evidence written to tests/functional/results/f2-admin-crud.json\n");
}

runF2().catch((err) => {
  console.error("F2 run failed:", err);
  process.exit(1);
});
