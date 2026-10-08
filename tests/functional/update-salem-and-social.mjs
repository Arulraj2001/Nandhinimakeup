import { adminClient } from "./common.mjs";

console.log("=== UPDATING LOCATION TO SALEM & ADDING SOCIAL/RELATED SERVICES ===");

async function updateSalemAndSocial() {
  // 1. Update Site Settings (business, social, home)
  console.log("\n1. Updating Site Settings (Business, Social, Home)...");

  const businessUpdate = {
    business_name: "Nandhini Makeup & Jewellery",
    tagline: "Bridal Makeup Artistry & Curated Jewellery Rental",
    phone: "+917010847631",
    whatsapp_number: "+917010847631",
    email: "nandhinimakeups@gmail.com",
    full_address: "Fairlands, Salem, Tamil Nadu - 636016, India",
    street_address: "Fairlands",
    address_locality: "Salem",
    address_region: "Tamil Nadu",
    postal_code: "636016",
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

  const socialUpdate = {
    instagram_primary: "https://www.instagram.com/nandhini__makeupartist/",
    instagram_secondary: "https://www.instagram.com/nandhu_accessorie/",
    facebook: "",
    youtube: "",
  };

  const { data: currentHome } = await adminClient
    .from("site_settings")
    .select("value")
    .eq("key", "home")
    .single();

  const homeUpdate = {
    ...(currentHome?.value || {}),
    hero_headline: "Crafting Timeless South Indian Brides & Handcrafted Adornments",
    hero_supporting_text: "Flawless HD & Glossy bridal makeup starting at ₹5,999 paired with Salem's finest antique temple, AD, and Victorian jewellery for rent starting at ₹999/day.",
    closing_cta_headline: "Ready for Your Dream Wedding Look in Salem?",
    closing_cta_text: "Connect directly with Nandhini on WhatsApp to check wedding date availability and reserve bridal jewellery.",
    counters: [
      { number: 500, label: "Brides Styled" },
      { number: 1000, label: "Jewellery Sets Rented" },
      { number: 5, label: "Star Google Rating" },
    ],
  };

  await adminClient.from("site_settings").upsert({ key: "business", value: businessUpdate });
  await adminClient.from("site_settings").upsert({ key: "social", value: socialUpdate });
  await adminClient.from("site_settings").upsert({ key: "home", value: homeUpdate });
  console.log("  ✓ Business updated (Salem address)");
  console.log("  ✓ Social updated (both Instagram accounts)");
  console.log("  ✓ Home updated (Salem hero text)");

  // 2. Update Announcements
  console.log("\n2. Updating Active Announcement Banner for Salem...");
  await adminClient.from("announcements").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await adminClient.from("announcements").insert({
    message: "✨ Wedding Season Booking Open: HD Bridal Makeup from ₹5,999 • Jewellery Rental from ₹999/day • Salem & Travel Available",
    link_url: "/services",
    link_text: "Explore Packages",
    is_active: true,
    sort_order: 1,
  });
  console.log("  ✓ Announcement banner updated for Salem");

  // 3. Update Testimonials for Salem
  console.log("\n3. Updating Testimonials for Salem...");
  await adminClient.from("testimonials").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const testimonialsSalem = [
    {
      customer_name: "Swetha R.",
      occasion: "Muhurtham Bride (Fairlands, Salem)",
      quote: "Nandhini did my Muhurtham makeup in Salem and it was an absolute dream! It stayed completely fresh, radiant and sweat-proof despite the homam mandap lights. The temple jewellery rental was also of top-notch antique quality.",
      rating: 5,
      source: "google",
      is_featured: true,
      is_published: true,
      sort_order: 1,
    },
    {
      customer_name: "Divya Karthik",
      occasion: "Reception Bride (Shevapet, Salem)",
      quote: "I opted for the Glossy Reception look and rented the American Diamond choker set. Everyone at the hall in Salem complimented the glow and the jewellery sparkle! Thank you Nandhini for making my big day so memorable.",
      rating: 5,
      source: "instagram",
      is_featured: true,
      is_published: true,
      sort_order: 2,
    },
    {
      customer_name: "Sneha M.",
      occasion: "Engagement (Alagapuram, Salem)",
      quote: "The Simple Engagement Makeup package at ₹5,999 was worth every single rupee. Subtle, classy, and zero over-the-top cakey feeling. Booking on WhatsApp was super smooth.",
      rating: 5,
      source: "whatsapp",
      is_featured: true,
      is_published: true,
      sort_order: 3,
    },
  ];
  await adminClient.from("testimonials").insert(testimonialsSalem);
  console.log("  ✓ Testimonials updated with Salem venues");

  // 4. Update FAQs for Salem
  console.log("\n4. Updating FAQs for Salem...");
  await adminClient.from("faqs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const faqsSalem = [
    {
      group: "services",
      question: "How early should I book my bridal makeup package?",
      answer: "We recommend booking your date 3 to 6 months in advance, especially during peak Tamil wedding seasons (Aavani, Thai, Panguni, Vaikasi), to guarantee artist availability in Salem.",
      is_published: true,
      sort_order: 1,
    },
    {
      group: "services",
      question: "Do you travel to wedding halls outside Salem?",
      answer: "Yes! We travel across Salem, Tamil Nadu (Erode, Namakkal, Dharmapuri, Coimbatore, Chennai), Bangalore, and destination wedding venues. Outstation travel and stay logistics are billed transparently.",
      is_published: true,
      sort_order: 2,
    },
    {
      group: "jewellery",
      question: "How does the jewellery rental process and security deposit work?",
      answer: "You can rent any set starting at ₹999/day. A refundable security deposit is collected at Salem studio pickup or courier dispatch. Once the jewellery is returned safely, 100% of the deposit is refunded to your UPI account within 24 hours.",
      is_published: true,
      sort_order: 3,
    },
    {
      group: "jewellery",
      question: "How are the rental jewellery sets sanitized?",
      answer: "Every piece undergoes ultrasonic hygiene cleansing and sanitization before being packed in protective velvet presentation boxes.",
      is_published: true,
      sort_order: 4,
    },
  ];
  await adminClient.from("faqs").insert(faqsSalem);
  console.log("  ✓ FAQs updated for Salem");

  // 5. Add 3rd service to Reception & Party category for related services richness
  console.log("\n5. Ensuring Reception & Party category has rich related services...");
  const { data: recCat } = await adminClient
    .from("service_categories")
    .select("id")
    .eq("slug", "reception-party")
    .single();

  const { data: mediaImg } = await adminClient
    .from("media")
    .select("id")
    .ilike("file_name", "%glossy%")
    .limit(1)
    .single();

  if (recCat) {
    const sangeetService = {
      category_id: recCat.id,
      name: "Cocktail & Sangeet Glam Makeup",
      slug: "cocktail-sangeet-glam-makeup",
      short_description: "Glamorous evening party look with smokey/shimmer eyes, sculpted contouring, and modern textured curls. Perfect for sangeet nights.",
      price_type: "fixed",
      price: 7999,
      duration_minutes: 120,
      image_id: mediaImg?.id || null,
      includes_list: [
        "HD Camera-Ready Base",
        "Glamorous Smokey / Shimmer Eye Artistry",
        "Textured Ponytail or Curls Styling",
        "Indo-Western / Saree Pleating",
        "All-Night Long-Wear Setting Spray",
      ],
      is_featured: true,
      is_published: true,
      sort_order: 4,
    };

    await adminClient.from("services").upsert(sangeetService, { onConflict: "slug" });
    console.log("  ✓ Added 'Cocktail & Sangeet Glam Makeup' to Reception & Party");
  }

  console.log("\n=== ALL UPDATES APPLIED SUCCESSFULLY! ===");
}

updateSalemAndSocial().catch((err) => {
  console.error("Update failed:", err);
  process.exit(1);
});
