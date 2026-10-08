"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicSiteSettings } from "@/lib/data/settings";
import { revalidateCacheTag, CACHE_TAGS } from "@/lib/utils/revalidate";
import {
  type ActionResult,
  actionSuccess,
  actionError,
} from "@/lib/actions/action-result";
import {
  checkoutSubmissionSchema,
  normalizeIndianPhone,
  type CheckoutSubmissionData,
} from "@/lib/validation/checkout";

export interface CheckoutSuccessData {
  orderNumber: string;
  accessToken: string;
  orderId: string;
}

export async function submitCheckout(
  data: CheckoutSubmissionData
): Promise<ActionResult<CheckoutSuccessData>> {
  // 1. Validate submission input with Zod
  const parsed = checkoutSubmissionSchema.safeParse(data);
  if (!parsed.success) {
    return actionError("Validation failed", parsed.error.flatten().fieldErrors);
  }

  const input = parsed.data;

  // 2. Honeypot anti-spam check
  if (input.honeypot && input.honeypot.trim().length > 0) {
    return actionError("Invalid submission.");
  }

  // 3. Normalise phone number to +91XXXXXXXXXX
  const normalizedPhone = normalizeIndianPhone(input.phone);
  if (!normalizedPhone) {
    return actionError("Invalid Indian phone number.", {
      phone: ["Please enter a valid 10-digit Indian mobile number."],
    });
  }

  // 4. Rate-limiting check: Reject if same phone has >= 3 pending_payment orders in last 24h
  const adminClient = createAdminClient();
  const twentyFourHoursAgo = new Date(
    Date.now() - 24 * 60 * 60 * 1000
  ).toISOString();

  const { count: pendingCount, error: countError } = await adminClient
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("phone", normalizedPhone)
    .eq("status", "pending_payment")
    .gte("created_at", twentyFourHoursAgo);

  if (countError) {
    console.error("Failed to check rate limit:", countError);
  } else if (pendingCount !== null && pendingCount >= 3) {
    return actionError(
      "You have multiple pending orders awaiting payment. Please complete payment for existing orders or contact us directly on WhatsApp."
    );
  }

  // 5. Read current site & delivery settings on the server
  const settings = await getPublicSiteSettings();
  if (!settings.shipping.accept_orders) {
    return actionError(
      "Online order placement is currently paused. Please contact us on WhatsApp to order."
    );
  }

  const flatDeliveryCharge =
    Number(settings.shipping.flat_delivery_charge) || 0;
  const freeDeliveryThreshold =
    settings.shipping.free_delivery_threshold !== null
      ? Number(settings.shipping.free_delivery_threshold)
      : 0;
  const orderNumberPrefix = settings.shipping.order_number_prefix || "ORD";

  // 6. Call create_order RPC function with admin client inside a single Postgres transaction
  const itemsPayload = input.items.map((item) => ({
    product_id: item.productId,
    quantity: item.quantity,
  }));

  const { data: dbResult, error: rpcError } = await adminClient.rpc(
    "create_order",
    {
      p_items: itemsPayload,
      p_customer_name: input.customer_name,
      p_phone: normalizedPhone,
      p_email: input.email || null,
      p_address_line_1: input.address_line_1,
      p_address_line_2: input.address_line_2 || null,
      p_city: input.city,
      p_state: input.state,
      p_pin_code: input.pin_code,
      p_customer_note: input.customer_note || null,
      p_flat_delivery_charge: flatDeliveryCharge,
      p_free_delivery_threshold: freeDeliveryThreshold,
      p_order_number_prefix: orderNumberPrefix,
    }
  );

  if (rpcError) {
    console.error("create_order RPC error:", rpcError);
    return actionError(
      rpcError.message ||
        "An unexpected error occurred while placing your order. Please try again."
    );
  }

  // 7. Revalidate product cache tags to reflect inventory changes
  revalidateCacheTag(CACHE_TAGS.products);

  const orderData = dbResult as {
    order_number: string;
    access_token: string;
    order_id: string;
  };

  return actionSuccess({
    orderNumber: orderData.order_number,
    accessToken: orderData.access_token,
    orderId: orderData.order_id,
  });
}
