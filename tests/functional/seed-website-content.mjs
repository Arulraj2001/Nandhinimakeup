import fs from "node:fs";
import path from "node:path";
import { adminClient } from "./common.mjs";

console.log("=== SEEDING NANDHINI MAKEUP & JEWELLERY CONTENT ===");

const BRAIN_DIR = "C:/Users/samue/.gemini/antigravity-ide/brain/79f1f464-287b-4605-8c3a-cb0168bca11b";

const IMAGES_TO_UPLOAD = [
  { key: "hero_bride", file: "hero_south_indian_bride_1791463430215.jpg", alt: "South Indian Muhurtham Bride in Kanchipuram Silk and Antique Jewellery" },
  { key: "hd_bridal", file: "service_hd_bridal_1791463461350.jpg", alt: "HD Bridal Makeup Artist in Chennai" },
  { key: "glossy_reception", file: "service_glossy_reception_1791463485712.jpg", alt: "Glossy Glass Skin Reception Makeup" },
  { key: "simple_party", file: "service_simple_party_1791463518973.jpg", alt: "Simple Engagement and Party Makeup" },
  { key: "antique_nagas", file: "jewellery_antique_nagas_1791463549710.jpg", alt: "Matte Nagas Temple Jewellery Choker Set for Rent" },
  { key: "ad_diamond", file: "jewellery_ad_diamond_set_1791463580008.jpg", alt: "American Diamond AD Bridal Necklace Set for Rent" },
  { key: "victorian_emerald", file: "jewellery_victorian_emerald_1791463608297.jpg", alt: "Royal Victorian Polish Polki Emerald Choker Set for Rent" },
  { key: "trans_before", file: "transformation_before_1791463644911.jpg", alt: "Bride Before Makeup Transformation" },
  { key: "trans_after", file: "transformation_after_1791463686455.jpg", alt: "Bride After Muhurtham Bridal Makeup Transformation" },
];

async function seedContent() {
  const mediaMap = {};

  // 1. Upload Images to Supabase Storage & Insert Media Rows
  console.log("\n1. Uploading Photographic Assets to Storage & Media Library...");
  for (const img of IMAGES_TO_UPLOAD) {
    const localPath = path.join(BRAIN_DIR, img.file);
    if (!fs.existsSync(localPath)) {
      console.warn(`  File not found locally: ${localPath}`);
      continue;
    }

    const fileBuffer = fs.readFileSync(localPath);
    const storagePath = `uploads/${Date.now()}_${img.file}`;

    const { error: uploadError } = await adminClient.storage
      .from("media")
      .upload(storagePath, fileBuffer, { contentType: "image/jpeg", upsert: true });

    if (uploadError) {
      console.error(`  Upload failed for ${img.file}:`, uploadError);
      continue;
    }

    const { data: mediaRow, error: mediaError } = await adminClient
      .from("media")
      .insert({
        file_name: img.file,
        storage_path: storagePath,
        mime_type: "image/jpeg",
        size_bytes: fileBuffer.length,
        alt_text: img.alt,
        width: 1200,
        height: 900,
      })
      .select()
      .single();

    if (mediaError) {
      console.error(`  Media insert error for ${img.file}:`, mediaError);
    } else {
      mediaMap[img.key] = mediaRow;
      console.log(`  ✓ Uploaded & registered: ${img.key} (Media ID: ${mediaRow.id})`);
    }
  }

  // 2. Seed Service Categories
  console.log("\n2. Seeding Service Categories...");
  const serviceCategoriesData = [
    { name: "Bridal Makeup", slug: "bridal-makeup", description: "Waterproof HD & Muhurtham bridal packages for your dream wedding day.", sort_order: 1 },
    { name: "Reception & Party", slug: "reception-party", description: "Dewy glossy glass-skin and modern evening styling.", sort_order: 2 },
    { name: "Saree Draping & Styling", slug: "saree-draping-styling", description: "Authentic Madisar, Kanchipuram silk pleating and traditional poola jada.", sort_order: 3 },
  ];

  const serviceCategoryMap = {};
  for (const cat of serviceCategoriesData) {
    const { data, error } = await adminClient
      .from("service_categories")
      .upsert(cat, { onConflict: "slug" })
      .select()
      .single();
    if (error) console.error(`  Error creating category ${cat.name}:`, error);
    else {
      serviceCategoryMap[cat.slug] = data.id;
      console.log(`  ✓ Category: ${cat.name} (${data.id})`);
    }
  }

  // 3. Seed Services
  console.log("\n3. Seeding Makeup Services...");
  const servicesData = [
    {
      category_id: serviceCategoryMap["reception-party"],
      name: "Simple Party & Engagement Makeup",
      slug: "simple-party-engagement-makeup",
      short_description: "Fresh, lightweight HD makeover with subtle glowing skin and elegant hairstyling. Perfect for engagements and sangeets.",
      price_type: "starting_from",
      price: 5999,
      duration_minutes: 90,
      image_id: mediaMap.simple_party?.id || null,
      includes_list: [
        "Lightweight HD Base",
        "Subtle Eye Shimmer & Liner",
        "Standard Hairstyling (Curls/Low Bun)",
        "Saree / Dupatta Box Pleating",
        "Setting Spray for 8-Hour Hold"
      ],
      is_featured: true,
      is_published: true,
      sort_order: 1,
    },
    {
      category_id: serviceCategoryMap["bridal-makeup"],
      name: "HD Bridal Makeup",
      slug: "hd-bridal-makeup",
      short_description: "Signature camera-ready 4K HD bridal makeup designed for zero flashback under professional wedding photography lights.",
      price_type: "fixed",
      price: 12999,
      duration_minutes: 180,
      image_id: mediaMap.hd_bridal?.id || null,
      includes_list: [
        "4K Waterproof HD Base (MAC & Kryolan)",
        "Defined Eye Artistry & Mink Lashes",
        "Bridal Hairstyling with Hair Extensions",
        "Premium Kanchipuram Saree Pleating",
        "Bridal Touch-Up Kit Included"
      ],
      is_featured: true,
      is_published: true,
      sort_order: 2,
    },
    {
      category_id: serviceCategoryMap["reception-party"],
      name: "Glossy Reception Makeup",
      slug: "glossy-reception-makeup",
      short_description: "Ultra-hydrated glass-skin finish with radiant highlights and Hollywood waves for an unforgettable grand reception entrance.",
      price_type: "fixed",
      price: 14999,
      duration_minutes: 150,
      image_id: mediaMap.glossy_reception?.id || null,
      includes_list: [
        "Ultra-Hydrated Radiant Glass Skin Base",
        "Luminous Cheek Highlights & Glow",
        "Glamorous Hollywood Waves or Textured Updo",
        "Gown / Designer Lehenga Setting",
        "Long-Wear High-Shine Gloss Setting"
      ],
      is_featured: true,
      is_published: true,
      sort_order: 3,
    },
    {
      category_id: serviceCategoryMap["bridal-makeup"],
      name: "Traditional Muhurtham Bridal Combo",
      slug: "traditional-muhurtham-bridal-combo",
      short_description: "Complete South Indian Muhurtham experience: heat-resistant waterproof base for mandap homam lights, authentic poola jada, and jewellery pinning.",
      price_type: "fixed",
      price: 18999,
      duration_minutes: 210,
      image_id: mediaMap.hero_bride?.id || null,
      includes_list: [
        "Heat & Sweat Resistant Waterproof Base",
        "Traditional Poola Jada (Fresh Flowers Setting)",
        "Madisar / Kanchipuram Silk Draping",
        "Complete Temple Jewellery Setting & Pinning",
        "Bridal Touch-Up & Emergency Kit"
      ],
      is_featured: true,
      is_published: true,
      sort_order: 4,
    },
  ];

  for (const s of servicesData) {
    const { data, error } = await adminClient
      .from("services")
      .upsert(s, { onConflict: "slug" })
      .select()
      .single();
    if (error) console.error(`  Error creating service ${s.name}:`, error);
    else console.log(`  ✓ Service: ${s.name} (₹${s.price})`);
  }

  // 4. Seed Product Categories (Jewellery)
  console.log("\n4. Seeding Jewellery Product Categories...");
  const productCategoriesData = [
    { name: "Antique Jewellery", slug: "antique-jewellery", description: "Traditional matte gold temple jewellery with Nagas and Kemp stones.", sort_order: 1 },
    { name: "American Diamond (AD) Sets", slug: "ad-sets", description: "Sparkling diamond-look rhodium and rose gold sets for reception and sangeet.", sort_order: 2 },
    { name: "Victorian Sets", slug: "victorian-sets", description: "Royal dark vintage polish chokers with uncut polki and emerald drops.", sort_order: 3 },
  ];

  const productCategoryMap = {};
  for (const cat of productCategoriesData) {
    const { data, error } = await adminClient
      .from("product_categories")
      .upsert(cat, { onConflict: "slug" })
      .select()
      .single();
    if (error) console.error(`  Error creating product category ${cat.name}:`, error);
    else {
      productCategoryMap[cat.slug] = data.id;
      console.log(`  ✓ Product Category: ${cat.name} (${data.id})`);
    }
  }

  // 5. Seed Products (Jewellery Rental)
  console.log("\n5. Seeding Jewellery Rental Products...");
  const productsData = [
    {
      category_id: productCategoryMap["antique-jewellery"],
      name: "Matte Nagas Temple Choker Set",
      slug: "matte-nagas-temple-choker-set",
      description: "Authentic temple choker set handcrafted with Goddess Lakshmi carvings and ruby kemp stones. Includes matching jhumkas. Available for bridal rental from ₹999/day.",
      price: 999,
      stock_status: "in_stock",
      is_featured: true,
      is_new: true,
      sort_order: 1,
      mediaKey: "antique_nagas",
    },
    {
      category_id: productCategoryMap["ad-sets"],
      name: "Emerald Drop Layered AD Choker Set",
      slug: "emerald-drop-layered-ad-choker-set",
      description: "Glamorous rhodium-polished American Diamond choker necklace with emerald green centerpieces and matching chandelier earrings for reception.",
      price: 1499,
      stock_status: "in_stock",
      is_featured: true,
      is_new: true,
      sort_order: 2,
      mediaKey: "ad_diamond",
    },
    {
      category_id: productCategoryMap["victorian-sets"],
      name: "Royal Victorian Polki & Emerald Bridal Set",
      slug: "royal-victorian-polki-emerald-bridal-set",
      description: "High-end Victorian dark rhodium statement choker studded with uncut polki and hanging emerald drop beads. Pure regal luxury.",
      price: 1999,
      stock_status: "in_stock",
      is_featured: true,
      is_new: true,
      sort_order: 3,
      mediaKey: "victorian_emerald",
    },
  ];

  for (const p of productsData) {
    const { mediaKey, ...pData } = p;
    const { data: prod, error } = await adminClient
      .from("products")
      .upsert(pData, { onConflict: "slug" })
      .select()
      .single();

    if (error) {
      console.error(`  Error creating product ${p.name}:`, error);
    } else {
      console.log(`  ✓ Product: ${p.name} (Rent ₹${p.price}/day)`);

      // Link product image
      if (mediaMap[mediaKey]?.id) {
        await adminClient
          .from("product_images")
          .delete()
          .eq("product_id", prod.id);

        await adminClient.from("product_images").insert({
          product_id: prod.id,
          media_id: mediaMap[mediaKey].id,
          sort_order: 1,
        });
        console.log(`    ↳ Linked image: ${mediaKey}`);
      }
    }
  }

  // 6. Seed Gallery Items (Before & After + Single)
  console.log("\n6. Seeding Gallery Items...");
  if (mediaMap.trans_before?.id && mediaMap.trans_after?.id) {
    await adminClient.from("gallery_items").upsert({
      title: "Real Muhurtham Bridal Transformation - Sangeetha, Chennai",
      type: "before_after",
      before_image_id: mediaMap.trans_before.id,
      after_image_id: mediaMap.trans_after.id,
      is_featured: true,
      sort_order: 1,
    });
    console.log("  ✓ Created Before & After Slider Gallery Item");
  }

  if (mediaMap.hero_bride?.id) {
    await adminClient.from("gallery_items").upsert({
      title: "Traditional South Indian Muhurtham Bride with Nagas Temple Jewellery",
      type: "single",
      image_id: mediaMap.hero_bride.id,
      is_featured: true,
      sort_order: 2,
    });
    console.log("  ✓ Created Featured Single Gallery Item");
  }

  // 7. Seed Testimonials
  console.log("\n7. Seeding Real Bride Testimonials...");
  const testimonialsData = [
    {
      client_name: "Swetha R.",
      role_or_event: "Muhurtham Bride (Mayor Ramanathan Hall, Chennai)",
      quote: "Nandhini did my Muhurtham makeup and it was an absolute dream! It stayed completely fresh, radiant and sweat-proof despite the homam mandap lights. The temple jewellery rental was also of top-notch antique quality.",
      rating: 5,
      is_featured: true,
      sort_order: 1,
    },
    {
      client_name: "Divya Karthik",
      role_or_event: "Reception Bride (Mylapore, Chennai)",
      quote: "I opted for the Glossy Reception look and rented the American Diamond choker set. Everyone at the hall complimented the glow and the jewellery sparkle! Thank you Nandhini for making my big day so memorable.",
      rating: 5,
      is_featured: true,
      sort_order: 2,
    },
    {
      client_name: "Sneha M.",
      role_or_event: "Engagement (Anna Nagar, Chennai)",
      quote: "The Simple Engagement Makeup package at ₹5,999 was worth every single rupee. Subtle, classy, and zero over-the-top cakey feeling. Booking on WhatsApp was super smooth.",
      rating: 5,
      is_featured: true,
      sort_order: 3,
    },
  ];

  for (const t of testimonialsData) {
    await adminClient.from("testimonials").insert(t);
    console.log(`  ✓ Testimonial: ${t.client_name}`);
  }

  // 8. Seed FAQs
  console.log("\n8. Seeding FAQs...");
  const faqsData = [
    {
      category: "Makeup Services",
      question: "How early should I book my bridal makeup package?",
      answer: "We recommend booking your date 3 to 6 months in advance, especially during peak Tamil wedding seasons (Aavani, Thai, Panguni, Vaikasi), to guarantee artist availability.",
      sort_order: 1,
      is_published: true,
    },
    {
      category: "Makeup Services",
      question: "Do you travel to wedding halls outside Chennai?",
      answer: "Yes! We travel across Chennai, Tamil Nadu (Coimbatore, Madurai, Trichy, Tirunelveli), Bangalore, and destination wedding venues. Outstation travel and stay logistics are billed transparently.",
      sort_order: 2,
      is_published: true,
    },
    {
      category: "Jewellery Rental",
      question: "How does the jewellery rental process and security deposit work?",
      answer: "You can rent any set starting at ₹999/day. A refundable security deposit is collected at studio pickup or courier dispatch. Once the jewellery is returned safely, 100% of the deposit is refunded to your UPI account within 24 hours.",
      sort_order: 3,
      is_published: true,
    },
    {
      category: "Jewellery Rental",
      question: "How are the rental jewellery sets sanitized?",
      answer: "Every piece undergoes ultrasonic hygiene cleansing and sanitization before being packed in protective velvet presentation boxes.",
      sort_order: 4,
      is_published: true,
    },
  ];

  for (const faq of faqsData) {
    await adminClient.from("faqs").insert(faq);
    console.log(`  ✓ FAQ: ${faq.question}`);
  }

  // 9. Seed Announcement Banner
  console.log("\n9. Seeding Active Announcement Banner...");
  await adminClient.from("announcements").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await adminClient.from("announcements").insert({
    message: "✨ Wedding Season Booking Open: HD Bridal Makeup from ₹5,999 • Jewellery Rental from ₹999/day • Chennai & Travel Available",
    link_url: "/services",
    link_text: "Explore Packages",
    is_active: true,
    sort_order: 1,
  });
  console.log("  ✓ Active Announcement Banner Created");

  // 10. Update Site Settings (Home, Business, Branding)
  console.log("\n10. Updating Site Settings...");
  const updatedBusiness = {
    business_name: "Nandhini Makeup & Jewellery",
    tagline: "Bridal Makeup Artistry & Curated Jewellery Rental",
    phone: "+917010847631",
    whatsapp_number: "+917010847631",
    email: "nandhinimakeups@gmail.com",
    full_address: "Chennai, Tamil Nadu, India",
    opening_hours: {
      monday: { isClosed: false, openTime: "09:00", closeTime: "20:00" },
      tuesday: { isClosed: false, openTime: "09:00", closeTime: "20:00" },
      wednesday: { isClosed: false, openTime: "09:00", closeTime: "20:00" },
      thursday: { isClosed: false, openTime: "09:00", closeTime: "20:00" },
      friday: { isClosed: false, openTime: "09:00", closeTime: "20:00" },
      saturday: { isClosed: false, openTime: "09:00", closeTime: "20:00" },
      sunday: { isClosed: true, openTime: "10:00", closeTime: "18:00" },
    },
    google_maps_link: "",
  };

  const updatedHome = {
    hero_headline: "Crafting Timeless South Indian Brides & Handcrafted Adornments",
    hero_supporting_text: "Flawless HD & Glossy bridal makeup starting at ₹5,999 paired with Chennai's finest antique temple, AD, and Victorian jewellery for rent starting at ₹999/day.",
    hero_image_id: mediaMap.hero_bride?.id || null,
    hero_primary_button: "services",
    closing_cta_headline: "Ready for Your Dream Wedding Look?",
    closing_cta_text: "Connect directly with Nandhini on WhatsApp to check wedding date availability and reserve bridal jewellery.",
    counters: [
      { number: 500, label: "Brides Styled" },
      { number: 1000, label: "Jewellery Sets Rented" },
      { number: 5, label: "Star Google Rating" },
    ],
  };

  await adminClient.from("site_settings").upsert({ key: "business", value: updatedBusiness });
  await adminClient.from("site_settings").upsert({ key: "home", value: updatedHome });
  console.log("  ✓ Updated Business and Home Settings");

  console.log("\n=== SEEDING COMPLETED SUCCESSFULLY! ===");
}

seedContent().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
