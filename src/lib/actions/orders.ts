"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  type ActionResult,
  actionSuccess,
  actionError,
} from "@/lib/actions/action-result";
import { timingSafeEqualStr } from "@/lib/utils/crypto";

export { timingSafeEqualStr };

export interface SubmitPaymentInput {
  orderNumber: string;
  token: string;
  reference?: string;
}

/**
 * Customer action to mark an order as payment_submitted with optional transaction reference.
 * Strictly requires a matching access token.
 * Only works when current status is pending_payment; ignores all other statuses.
 * NEVER marks an order as paid.
 */
export async function submitCustomerPayment(
  input: SubmitPaymentInput
): Promise<ActionResult<{ orderNumber: string }>> {
  const { orderNumber, token, reference } = input;
  if (!orderNumber || !token) {
    return actionError("Missing order number or access token.");
  }

  // Validate reference format if provided: 8 to 30 letters or digits
  const trimmedRef = reference ? reference.trim() : "";
  if (trimmedRef && !/^[a-zA-Z0-9]{8,30}$/.test(trimmedRef)) {
    return actionError(
      "Transaction reference must be 8 to 30 alphanumeric characters (letters and digits only)."
    );
  }

  const adminClient = createAdminClient();

  const { data: order, error } = await adminClient
    .from("orders")
    .select("id, order_number, access_token, status")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (error || !order) {
    return actionError("Order could not be found.");
  }

  // Timing safe comparison of token
  if (!timingSafeEqualStr(order.access_token, token)) {
    return actionError("Invalid access token.");
  }

  // Ignore if status is not pending_payment
  if (order.status !== "pending_payment") {
    return actionSuccess({ orderNumber: order.order_number });
  }

  // Update status to payment_submitted and record reference
  const { error: updateError } = await adminClient
    .from("orders")
    .update({
      status: "payment_submitted",
      payment_reference: trimmedRef || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id)
    .eq("status", "pending_payment");

  if (updateError) {
    console.error("Failed to update order status:", updateError);
    return actionError("Failed to submit payment details. Please try again.");
  }

  revalidatePath(`/order/${orderNumber}`);
  return actionSuccess({ orderNumber: order.order_number });
}
