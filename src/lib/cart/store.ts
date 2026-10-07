"use client";

import { useSyncExternalStore } from "react";

export interface CartItem {
  productId: string;
  quantity: number;
}

const STORAGE_KEY = "nm_cart_v1";
const EMPTY_CART: CartItem[] = [];

let memoryCart: CartItem[] = [];
let isInitialized = false;
const listeners = new Set<() => void>();

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function sanitizeCart(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const sanitized: CartItem[] = [];
  const seenIds = new Set<string>();

  for (const item of raw) {
    if (
      item &&
      typeof item === "object" &&
      typeof (item as { productId?: unknown }).productId === "string"
    ) {
      const pid = (item as { productId: string }).productId.trim();
      const rawQty = (item as { quantity?: unknown }).quantity;
      const qty = typeof rawQty === "number" ? Math.floor(rawQty) : 1;

      if (pid && !seenIds.has(pid) && sanitized.length < 20) {
        seenIds.add(pid);
        const validQty = Math.max(1, Math.min(10, qty));
        sanitized.push({ productId: pid, quantity: validQty });
      }
    }
  }

  return sanitized;
}

function loadCartFromStorage(): CartItem[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return sanitizeCart(JSON.parse(raw));
  } catch {
    return [];
  }
}

function saveCartToStorage(cart: CartItem[]): void {
  memoryCart = cart;
  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore quota errors
    }
  }
  emitChange();
}

function emitChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

function initCartOnce(): void {
  if (isInitialized || typeof window === "undefined") return;
  isInitialized = true;
  memoryCart = loadCartFromStorage();

  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) {
      memoryCart = loadCartFromStorage();
      emitChange();
    }
  });
}

function subscribe(listener: () => void): () => void {
  initCartOnce();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): CartItem[] {
  if (!isInitialized && typeof window !== "undefined") {
    initCartOnce();
  }
  return memoryCart;
}

function getServerSnapshot(): CartItem[] {
  return EMPTY_CART;
}

/**
 * Public Cart API
 */
export const cartStore = {
  addItem(productId: string, quantity = 1): boolean {
    initCartOnce();
    const pid = productId.trim();
    if (!pid) return false;

    const existingIndex = memoryCart.findIndex((i) => i.productId === pid);
    let newCart: CartItem[];

    if (existingIndex >= 0) {
      newCart = memoryCart.map((item, idx) => {
        if (idx === existingIndex) {
          const nextQty = Math.min(10, item.quantity + quantity);
          return { ...item, quantity: nextQty };
        }
        return item;
      });
    } else {
      if (memoryCart.length >= 20) return false;
      const validQty = Math.max(1, Math.min(10, quantity));
      newCart = [...memoryCart, { productId: pid, quantity: validQty }];
    }

    saveCartToStorage(newCart);
    return true;
  },

  updateQuantity(productId: string, quantity: number): void {
    initCartOnce();
    const validQty = Math.floor(quantity);
    if (validQty <= 0) {
      cartStore.removeItem(productId);
      return;
    }

    const bounded = Math.min(10, Math.max(1, validQty));
    const newCart = memoryCart.map((item) =>
      item.productId === productId ? { ...item, quantity: bounded } : item
    );
    saveCartToStorage(newCart);
  },

  removeItem(productId: string): void {
    initCartOnce();
    const newCart = memoryCart.filter((item) => item.productId !== productId);
    saveCartToStorage(newCart);
  },

  clearCart(): void {
    saveCartToStorage([]);
  },
};

/**
 * Hook to access current cart items and cart mutating actions
 */
export function useCart() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const totalCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return {
    items,
    totalCount,
    addItem: cartStore.addItem,
    updateQuantity: cartStore.updateQuantity,
    removeItem: cartStore.removeItem,
    clearCart: cartStore.clearCart,
  };
}

/**
 * Lightweight hook for header cart count only
 */
export function useCartCount(): number {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return items.reduce((acc, item) => acc + item.quantity, 0);
}
