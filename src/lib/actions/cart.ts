"use server";

import { getPublicCartProducts, type CartProductLookup } from "@/lib/data/cart";

/**
 * Server action to fetch up-to-date product information for a list of cart IDs
 */
export async function lookupCartProducts(
  productIds: string[]
): Promise<CartProductLookup[]> {
  return getPublicCartProducts(productIds);
}
