import { adminClient } from "./common.mjs";

console.log("=== SEEDING BLOG CATEGORIES & ARTICLES ===");

async function seedBlog() {
  // 1. Categories
  const categories = [
    {
      name: "Bridal Makeup & Artistry",
      slug: "bridal-makeup-artistry",
      description: "Expert insights into South Indian bridal makeup techniques, HD bases, and long-wear tips.",
      sort_order: 1,
    },
    {
      name: "Jewellery Styling & Rentals",
      slug: "jewellery-styling-rentals",
      description: "Guides on pairing antique temple sets, AD diamonds, and Victorian choker sets with bridal silk sarees.",
      sort_order: 2,
    },
    {
      name: "Pre-Bridal Skincare & Prep",
      slug: "pre-bridal-skincare-prep",
      description: "Dermatologist-aligned, home-grown skincare rituals to achieve a natural wedding radiance.",
      sort_order: 3,
    },
  ];

  const createdCategories = [];
  for (const cat of categories) {
    const { data, error } = await adminClient
      .from("blog_categories")
      .upsert(cat, { onConflict: "slug" })
      .select()
      .single();

    if (error) {
      console.error(`Error creating category ${cat.slug}:`, error);
    } else {
      createdCategories.push(data);
      console.log(`  ✓ Category: ${data.name} (${data.slug})`);
    }
  }

  const skincareCat = createdCategories.find((c) => c.slug === "pre-bridal-skincare-prep");
  const makeupCat = createdCategories.find((c) => c.slug === "bridal-makeup-artistry");
  const jewelleryCat = createdCategories.find((c) => c.slug === "jewellery-styling-rentals");

  // Helper to build rich text document
  function buildDoc(paragraphs) {
    return {
      type: "doc",
      content: paragraphs.map((p) => {
        if (p.type === "heading") {
          return {
            type: "heading",
            attrs: { level: p.level || 2 },
            content: [{ type: "text", text: p.text }],
          };
        }
        return {
          type: "paragraph",
          content: [{ type: "text", text: p.text }],
        };
      }),
    };
  }

  const posts = [
    {
      title: "How to Prepare Your Skin 3 Months Before Your Wedding: A Salem Bride's Guide",
      slug: "how-to-prepare-your-skin-3-months-before-your-wedding",
      excerpt: "From hydration rituals to avoiding harsh chemical peels, discover Nandhini's expert bridal preparation timeline tailored for the Tamil Nadu climate.",
      category_id: skincareCat?.id,
      featured_image_id: "32559fdd-4dc0-4e40-94aa-bf1ab64814c6",
      author_name: "Nandhini Makeup & Jewellery",
      status: "published",
      published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      is_featured: true,
      reading_time_minutes: 5,
      content: buildDoc([
        {
          type: "heading",
          level: 2,
          text: "The Foundation of Flawless Bridal Artistry Begins Early",
        },
        {
          type: "paragraph",
          text: "No matter how high-definition your foundation is, radiant skin is always the canvas. For South Indian brides preparing for auspicious wedding dates in Salem, Namakkal, and Coimbatore, the humid climate demands a balanced, barrier-repair routine rather than aggressive treatments.",
        },
        {
          type: "heading",
          level: 3,
          text: "Month 1: Deep Hydration and Gentle Exfoliation",
        },
        {
          type: "paragraph",
          text: "Begin by drinking 3 liters of water daily and introducing hyaluronic acid serums. Avoid experimenting with high-strength acid peels or completely unfamiliar cosmetic facials within 90 days of your Muhurtham ceremony.",
        },
        {
          type: "heading",
          level: 3,
          text: "Month 2: Diet and Pre-Bridal Consultation",
        },
        {
          type: "paragraph",
          text: "Schedule your bridal makeup trial with our Salem studio. We analyze your skin texture, undertone, and saree color palettes to formulate the exact primer, moisture lock, and foundation match for your event.",
        },
        {
          type: "heading",
          level: 3,
          text: "Final 2 Weeks: The Golden Rule of Zero Stress",
        },
        {
          type: "paragraph",
          text: "Ensure 8 hours of uninterrupted sleep, keep lips deeply nourished with peptide balms, and trust our professional on-venue team to handle the magic on your big day.",
        },
      ]),
    },
    {
      title: "HD vs Glossy Makeup: Choosing the Perfect Finish for Muhurtham and Reception",
      slug: "hd-vs-glossy-makeup-choosing-the-perfect-finish",
      excerpt: "Understand the key differences between matte HD camera-ready makeup for sacred daytime Muhurthams and dewy glossy glass-skin glow for glittering evening receptions.",
      category_id: makeupCat?.id,
      featured_image_id: "09e70c18-b0cc-43da-bd03-482215e0fbe6",
      author_name: "Nandhini Makeup & Jewellery",
      status: "published",
      published_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      is_featured: false,
      reading_time_minutes: 4,
      content: buildDoc([
        {
          type: "heading",
          level: 2,
          text: "Traditional Mandap Radiance vs Evening Glamour",
        },
        {
          type: "paragraph",
          text: "One of the most frequent questions our Salem brides ask is: 'Should I choose HD Makeup or Glossy Makeup?' The answer depends heavily on your event timing, lighting, and attire.",
        },
        {
          type: "heading",
          level: 3,
          text: "Why HD Makeup is the Undisputed King of Daytime Muhurthams",
        },
        {
          type: "paragraph",
          text: "During a morning Muhurtham, intense homam sacred smoke, heavy yellow kalyana mandap spotlights, and four hours of rituals put makeup to the ultimate test. HD makeup provides micro-fine pigment particles that blur skin pores without flashback, resisting heat and perspiration effortlessly.",
        },
        {
          type: "heading",
          level: 3,
          text: "When Glossy Dewy Skin Takes the Spotlight",
        },
        {
          type: "paragraph",
          text: "For the evening Sangeet or grand reception, lighting is cooler and theatrical. Glossy makeup uses multi-reflective skincare primers, liquid highlighter draping, and soft glass-skin finishes that make brides look luminous in modern 4K cinematography.",
        },
      ]),
    },
    {
      title: "The Art of Pairing Antique Temple & Victorian Jewellery with Kanjivaram Silks",
      slug: "pairing-antique-temple-victorian-jewellery-with-kanjivaram-silks",
      excerpt: "Why Salem brides choose rental jewellery over buying heavy gold sets: styling tips for layering chokers, harams, and matching waist belts.",
      category_id: jewelleryCat?.id,
      featured_image_id: "f36d7b5f-16f5-4f40-b779-b8fcf582027c",
      author_name: "Nandhini Makeup & Jewellery",
      status: "published",
      published_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      is_featured: false,
      reading_time_minutes: 4,
      content: buildDoc([
        {
          type: "heading",
          level: 2,
          text: "Elevating Your Bridal Ensemble Without Lakhs in Gold Lockup",
        },
        {
          type: "paragraph",
          text: "Modern brides in Salem and across Tamil Nadu are making a smart, stylish choice: renting curated, authentic antique matte finish and Victorian jewellery sets rather than spending immense budgets on gold designs that get worn only once.",
        },
        {
          type: "heading",
          level: 3,
          text: "1. The Rule of Proportions for Kanjivaram Zari Borders",
        },
        {
          type: "paragraph",
          text: "If your saree features a grand korvai border with heavy gold zari, choose a matte antique Nagas choker paired with an intricate Lakshmi motif long haram. The antique matte patina complements the zari without clashing.",
        },
        {
          type: "heading",
          level: 3,
          text: "2. Victorian and American Diamond Sets for Pastel Sarees",
        },
        {
          type: "paragraph",
          text: "For brides wearing modern lavender, champagne, or rose-gold silks, Victorian emerald chokers or AD diamond statement necklaces add royal sophistication with brilliant sparkle.",
        },
      ]),
    },
  ];

  for (const post of posts) {
    const { data, error } = await adminClient
      .from("blog_posts")
      .upsert(post, { onConflict: "slug" })
      .select()
      .single();

    if (error) {
      console.error(`Error creating post ${post.slug}:`, error);
    } else {
      console.log(`  ✓ Post: ${data.title}`);
    }
  }

  console.log("=== BLOG SEEDED SUCCESSFULLY ===");
}

seedBlog().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
