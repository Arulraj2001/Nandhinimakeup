"use server";

import { verifyAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  type ActionResult,
  actionSuccess,
  actionError,
} from "@/lib/actions/action-result";
import { revalidateCacheTag, CACHE_TAGS } from "@/lib/utils/revalidate";
import type { Order, OrderItem, OrderStatus } from "@/types/orders";
import type { Database } from "@/types/database";
import { getPublicMediaUrl } from "@/lib/utils/media";

export interface AdminOrdersParams {
  status?: string;
  query?: string;
  page?: number;
  limit?: number;
}

export interface AdminOrdersResult {
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
}

export interface OrderItemWithThumbnail extends OrderItem {
  thumbnailUrl: string | null;
}

export interface OrderDetailWithItems extends Order {
  items: OrderItemWithThumbnail[];
}

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["payment_submitted", "paid", "cancelled"],
  payment_submitted: ["paid", "pending_payment", "cancelled"],
  paid: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

/**
 * Fetch paginated orders with optional status filter and search query
 */
export async function getAdminOrders(
  params?: AdminOrdersParams
): Promise<ActionResult<AdminOrdersResult>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const page = Math.max(1, params?.page || 1);
  const limit = Math.max(1, Math.min(50, params?.limit || 15));
  const offset = (page - 1) * limit;

  let query = auth.data.supabase
    .from("orders")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (params?.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  if (params?.query && params.query.trim()) {
    const q = params.query.trim();
    query = query.or(
      `order_number.ilike.%${q}%,customer_name.ilike.%${q}%,phone.ilike.%${q}%`
    );
  }

  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) {
    console.error("Failed to fetch admin orders:", error);
    return actionError(error.message || "Failed to load orders.");
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return actionSuccess({
    orders: (data || []) as Order[],
    total,
    page,
    totalPages,
  });
}

/**
 * Fetch complete order detail by ID including item snapshots and current product media
 */
export async function getAdminOrderDetail(
  orderId: string
): Promise<ActionResult<OrderDetailWithItems>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const { data: order, error: orderErr } = await auth.data.supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (orderErr || !order) {
    return actionError("Order not found.");
  }

  const { data: items, error: itemsErr } = await auth.data.supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId);

  if (itemsErr) {
    return actionError("Failed to fetch order items.");
  }

  // Fetch current thumbnail media for items where product still exists
  const productIds = (items || [])
    .map((i) => i.product_id)
    .filter((id): id is string => Boolean(id));

  const thumbnailMap: Record<string, string | null> = {};

  if (productIds.length > 0) {
    const { data: images } = await auth.data.supabase
      .from("product_images")
      .select("product_id, sort_order, media:media_id(storage_path)")
      .in("product_id", productIds)
      .order("sort_order", { ascending: true });

    if (images) {
      for (const img of images) {
        if (!thumbnailMap[img.product_id] && img.media) {
          const mediaRecord = img.media as unknown as { storage_path: string };
          if (mediaRecord?.storage_path) {
            thumbnailMap[img.product_id] = getPublicMediaUrl(mediaRecord.storage_path);
          }
        }
      }
    }
  }

  const itemsWithThumbnails: OrderItemWithThumbnail[] = (items || []).map(
    (item) => ({
      ...(item as OrderItem),
      thumbnailUrl: item.product_id ? thumbnailMap[item.product_id] || null : null,
    })
  );

  return actionSuccess({
    ...(order as Order),
    items: itemsWithThumbnails,
  });
}

/**
 * Update order status with strict allowed transition validation
 */
export async function updateAdminOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  options?: {
    courierName?: string;
    trackingNumber?: string;
  }
): Promise<ActionResult<Order>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const { data: currentOrder, error: fetchErr } = await auth.data.supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (fetchErr || !currentOrder) {
    return actionError("Order not found.");
  }

  const currentStatus = currentOrder.status as OrderStatus;

  // Validate allowed transitions
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    return actionError(
      `Cannot transition order status from "${currentStatus}" to "${newStatus}".`
    );
  }

  // Required field checks
  if (newStatus === "shipped" && !options?.courierName?.trim()) {
    return actionError("Courier name is required when marking an order as shipped.");
  }

  const now = new Date().toISOString();
  const updatePayload: Database["public"]["Tables"]["orders"]["Update"] = {
    status: newStatus,
    updated_at: now,
  };

  if (newStatus === "paid" && !currentOrder.paid_at) {
    updatePayload.paid_at = now;
  } else if (newStatus === "shipped") {
    updatePayload.shipped_at = now;
    updatePayload.courier_name = options?.courierName?.trim();
    updatePayload.tracking_number = options?.trackingNumber?.trim() || null;
  } else if (newStatus === "delivered" && !currentOrder.delivered_at) {
    updatePayload.delivered_at = now;
  }

  const { data: updated, error: updateErr } = await auth.data.supabase
    .from("orders")
    .update(updatePayload)
    .eq("id", orderId)
    .select()
    .single();

  if (updateErr || !updated) {
    console.error("Failed to update order status:", updateErr);
    return actionError("Failed to update order status.");
  }

  return actionSuccess(updated as Order);
}

/**
 * Cancel order via the cancel_order database function to restore inventory exactly once
 */
export async function cancelAdminOrder(
  orderId: string,
  cancelReason?: string
): Promise<ActionResult<{ orderId: string }>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient.rpc("cancel_order", {
    p_order_id: orderId,
    p_cancel_reason: cancelReason ? cancelReason.trim() : null,
  });

  if (error) {
    console.error("cancel_order RPC failed:", error);
    return actionError(error.message || "Failed to cancel order.");
  }

  // Revalidate product stock cache
  revalidateCacheTag(CACHE_TAGS.products);

  return actionSuccess({ orderId });
}

/**
 * Save internal admin note
 */
export async function saveAdminOrderNote(
  orderId: string,
  adminNote: string
): Promise<ActionResult<{ orderId: string }>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const { error } = await auth.data.supabase
    .from("orders")
    .update({
      admin_note: adminNote.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) {
    return actionError("Failed to save admin note.");
  }

  return actionSuccess({ orderId });
}
