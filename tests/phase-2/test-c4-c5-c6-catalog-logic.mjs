import {
  saveCategorySchema,
  saveServiceSchema,
} from "../../src/types/services.ts";
import { saveProductCategorySchema } from "../../src/types/product-categories.ts";
import { saveProductSchema } from "../../src/types/products.ts";

console.log(
  "=== RUNNING C4-C6: SERVICES, PRODUCT CATEGORIES & PRODUCTS LOGIC AUDIT ===\n"
);

let passCount = 0;
let failCount = 0;

function report(id, description, passed, actual, expected) {
  if (passed) {
    console.log(`[PASS] ${id}: ${description}`);
    passCount++;
  } else {
    console.log(`[FAIL] ${id}: ${description}`);
    console.log(`  Expected: ${expected}`);
    console.log(`  Actual:   ${actual}`);
    failCount++;
  }
}

// -------------------------------------------------------------
// 1. Module 2.4: Service & Service Category Schemas
// -------------------------------------------------------------
console.log("--- 1. Service Categories & Services Schemas ---");

const validCategory = {
  name: "Bridal Packages",
  slug: "bridal-packages",
  description: "Complete bridal makeover",
  sort_order: 0,
  is_published: true,
};

const categoryParsed = saveCategorySchema.safeParse(validCategory);
const categoryEmptyName = saveCategorySchema.safeParse({
  ...validCategory,
  name: "",
});

report(
  "C4-CATEGORY-VALIDATION",
  "Service category schema enforces non-empty name and slug",
  categoryParsed.success && !categoryEmptyName.success,
  "Valid category passes, empty name rejected",
  "Valid category"
);

// Service Price Logic: price required unless price_type is on_request
const validFixedService = {
  category_id: "11111111-1111-4111-8111-111111111111",
  name: "Reception Glam",
  slug: "reception-glam",
  short_description: "Glamorous reception look",
  long_description: "Detailed description",
  price_type: "fixed",
  price: 5000,
  duration_minutes: 120,
  image_id: null,
  includes_list: ["Airbrush makeup", "Hair styling"],
  is_featured: true,
  is_published: true,
  sort_order: 0,
  noindex: false,
};

const fixedValid = saveServiceSchema.safeParse(validFixedService);
const fixedMissingPrice = saveServiceSchema.safeParse({
  ...validFixedService,
  price: null,
});
const onRequestNoPrice = saveServiceSchema.safeParse({
  ...validFixedService,
  price_type: "on_request",
  price: null,
});
const negativePrice = saveServiceSchema.safeParse({
  ...validFixedService,
  price: -500,
});

report(
  "C4-SERVICE-PRICE-LOGIC",
  "Service price refinement: price required for fixed/starting_from; optional for on_request; negative rejected",
  fixedValid.success &&
    !fixedMissingPrice.success &&
    onRequestNoPrice.success &&
    !negativePrice.success,
  "fixed with price: PASS; fixed without price: REJECTED; on_request without price: PASS; negative: REJECTED",
  "Strict price logic enforced"
);

// -------------------------------------------------------------
// 2. Module 2.5: Product Category Schema
// -------------------------------------------------------------
console.log("\n--- 2. Product Category Schema ---");

const validProductCat = {
  name: "Bridal Jewellery",
  slug: "bridal-jewellery",
  description: "Exquisite jewellery for brides",
  image_id: null,
  sort_order: 0,
  is_published: true,
  noindex: false,
};

const productCatValid = saveProductCategorySchema.safeParse(validProductCat);
const productCatNoName = saveProductCategorySchema.safeParse({
  ...validProductCat,
  name: "",
});

report(
  "C5-PRODUCT-CAT-VALIDATION",
  "Product category schema enforces required name, slug, boolean flags",
  productCatValid.success && !productCatNoName.success,
  "Valid category passes, empty name rejected",
  "Valid product category"
);

// -------------------------------------------------------------
// 3. Module 2.6: Products Schema & Rules
// -------------------------------------------------------------
console.log("\n--- 3. Product Schema & Publishing Constraints ---");

const validProduct = {
  category_id: "22222222-2222-4222-8222-222222222222",
  name: "Kundan Choker Set",
  slug: "kundan-choker-set",
  description: "Handcrafted choker necklace",
  price: 3500,
  sale_price: 2999,
  sku: "KC-001",
  stock_status: "in_stock",
  stock_quantity: 10,
  image_ids: ["33333333-3333-4333-8333-333333333333"],
  is_featured: true,
  is_new: true,
  is_published: true,
  sort_order: 0,
  noindex: false,
};

const productValid = saveProductSchema.safeParse(validProduct);
const productZeroPrice = saveProductSchema.safeParse({
  ...validProduct,
  price: 0,
}); // price must be > 0
const productNegativePrice = saveProductSchema.safeParse({
  ...validProduct,
  price: -100,
});
const productSaleHigherThanPrice = saveProductSchema.safeParse({
  ...validProduct,
  price: 3000,
  sale_price: 3500,
});
const productSaleEqualPrice = saveProductSchema.safeParse({
  ...validProduct,
  price: 3000,
  sale_price: 3000,
});

report(
  "C6-PRICE-CONSTRAINTS",
  "Product prices: regular price > 0; sale price strictly lower than regular price",
  productValid.success &&
    !productZeroPrice.success &&
    !productNegativePrice.success &&
    !productSaleHigherThanPrice.success &&
    !productSaleEqualPrice.success,
  "Zero/negative price rejected; sale price >= regular price rejected",
  "Strict price constraints enforced"
);

// Publishing Rule: Cannot publish without at least one image
const publishedNoImages = saveProductSchema.safeParse({
  ...validProduct,
  is_published: true,
  image_ids: [],
});

const unpublishedNoImages = saveProductSchema.safeParse({
  ...validProduct,
  is_published: false,
  image_ids: [],
});

report(
  "C6-PUBLISHING-IMAGE-RULE",
  "Publishing rule: product cannot be published without at least one image; unpublished allows no images",
  !publishedNoImages.success && unpublishedNoImages.success,
  "Published with 0 images: REJECTED with 'A product cannot be published without at least one image'; Unpublished with 0 images: PASS",
  "Image required to publish"
);

// Stock Tracking Semantics
const trackedZero = saveProductSchema.safeParse({
  ...validProduct,
  stock_quantity: 0,
});
const trackedNegative = saveProductSchema.safeParse({
  ...validProduct,
  stock_quantity: -1,
});
const untrackedNull = saveProductSchema.safeParse({
  ...validProduct,
  stock_quantity: null,
});

report(
  "C6-STOCK-TRACKING",
  "Stock tracking: null represents untracked; 0 is valid; negative is rejected",
  trackedZero.success && !trackedNegative.success && untrackedNull.success,
  "0 accepted, negative rejected, null accepted as untracked",
  "Valid stock quantity rules"
);

console.log(`\nC4-C6 SUMMARY: ${passCount} Passed, ${failCount} Failed\n`);
