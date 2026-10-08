"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { OrderStatus } from "@/types/orders";
import type { OrderDetailWithItems } from "@/lib/actions/orders-admin";
import {
  updateAdminOrderStatus,
  cancelAdminOrder,
  saveAdminOrderNote,
} from "@/lib/actions/orders-admin";
import { formatINR } from "@/lib/utils/currency";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";

interface OrderDetailClientProps {
  order: OrderDetailWithItems;
  siteUrl: string;
}

export function OrderDetailClient({
  order: initialOrder,
  siteUrl,
}: OrderDetailClientProps) {
  const router = useRouter();
  const [order, setOrder] = React.useState<OrderDetailWithItems>(initialOrder);
  const [isUpdating, setIsUpdating] = React.useState(false);

  // Shipped details inputs
  const [courierName, setCourierName] = React.useState(
    order.courier_name || ""
  );
  const [trackingNumber, setTrackingNumber] = React.useState(
    order.tracking_number || ""
  );

  // Admin note input
  const [adminNote, setAdminNote] = React.useState(order.admin_note || "");
  const [savingNote, setSavingNote] = React.useState(false);

  // Cancel order state
  const [showCancelPrompt, setShowCancelPrompt] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState("");

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const fullAddress = [
    order.customer_name,
    order.address_line_1,
    order.address_line_2,
    `${order.city}, ${order.state} - ${order.pin_code}`,
    `Phone: ${order.phone}`,
  ]
    .filter(Boolean)
    .join("\n");

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      const res = await updateAdminOrderStatus(order.id, newStatus, {
        courierName: courierName.trim() || undefined,
        trackingNumber: trackingNumber.trim() || undefined,
      });

      if (!res.success) {
        toast.error(res.error || "Failed to update status");
        setIsUpdating(false);
        return;
      }

      toast.success(`Order status updated to ${newStatus}`);
      setOrder((prev) => ({
        ...prev,
        status: newStatus,
        courier_name: courierName.trim() || prev.courier_name,
        tracking_number: trackingNumber.trim() || prev.tracking_number,
      }));
      router.refresh();
    } catch {
      toast.error("Network error while updating order");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      const res = await cancelAdminOrder(order.id, cancelReason);
      if (!res.success) {
        toast.error(res.error || "Failed to cancel order");
        setIsUpdating(false);
        return;
      }

      toast.success("Order cancelled and stock restored successfully");
      setOrder((prev) => ({
        ...prev,
        status: "cancelled",
        cancel_reason: cancelReason || prev.cancel_reason,
        stock_restored: true,
      }));
      setShowCancelPrompt(false);
      router.refresh();
    } catch {
      toast.error("Failed to cancel order");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveNote = async () => {
    setSavingNote(true);
    const res = await saveAdminOrderNote(order.id, adminNote);
    setSavingNote(false);

    if (res.success) {
      toast.success("Admin note saved");
    } else {
      toast.error(res.error || "Failed to save note");
    }
  };

  const orderCustomerUrl = `${siteUrl}/order/${order.order_number}?token=${order.access_token}`;

  // WhatsApp prefilled links
  const waPaymentReceived = buildWhatsAppLink({
    phoneNumber: order.phone,
    greeting: `Hello ${order.customer_name}! We have received your payment for order #${order.order_number}.`,
    extraLines: [
      `Your order is confirmed and our team is preparing your jewellery piece(s)!`,
      `Total Paid: ${formatINR(Number(order.total))}`,
      `You can check your order status here: ${orderCustomerUrl}`,
    ],
  });

  const waShipped = buildWhatsAppLink({
    phoneNumber: order.phone,
    greeting: `Hello ${order.customer_name}! Good news - your order #${order.order_number} has been shipped!`,
    extraLines: [
      `Courier Partner: ${courierName || order.courier_name || "Standard Courier"}`,
      trackingNumber || order.tracking_number
        ? `Tracking Number: ${trackingNumber || order.tracking_number}`
        : "",
      `Order tracking details: ${orderCustomerUrl}`,
    ],
  });

  const waGeneralUpdate = buildWhatsAppLink({
    phoneNumber: order.phone,
    greeting: `Hello ${order.customer_name}! Update regarding your Nandhini Makeup & Jewellery order #${order.order_number}:`,
    extraLines: [`Status: ${order.status}`, `Order link: ${orderCustomerUrl}`],
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      {/* Header and Back Link */}
      <div>
        <Link
          href="/admin/orders"
          className="text-foreground/70 hover:text-foreground mb-2 inline-flex items-center gap-1 text-xs font-semibold tracking-wider uppercase"
        >
          ← Back to All Orders
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-foreground text-2xl font-semibold sm:text-3xl">
              Order #{order.order_number}
            </h1>
            <p className="text-foreground/60 mt-1 text-xs">
              Placed on{" "}
              {new Date(order.created_at).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>

          <div>
            <span
              className={`inline-flex items-center rounded-full px-3.5 py-1 text-xs font-bold tracking-wider uppercase ${
                order.status === "paid" || order.status === "delivered"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : order.status === "payment_submitted"
                    ? "bg-blue-600 text-white"
                    : order.status === "packed" || order.status === "shipped"
                      ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300"
                      : order.status === "cancelled"
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
              }`}
            >
              {order.status}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Reference & Bank Verification Reminder */}
      <div className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-5">
        <div className="flex items-start gap-3">
          <span className="text-lg text-amber-600">⚠️</span>
          <div className="space-y-1">
            <h2 className="text-foreground text-sm font-semibold">
              Bank / UPI App Credit Verification Reminder
            </h2>
            <p className="text-foreground/80 text-xs leading-relaxed sm:text-sm">
              Always open your own bank account or UPI app (Google Pay, PhonePe,
              Paytm, etc.) and confirm that a credit of{" "}
              <strong className="text-foreground font-semibold">
                {formatINR(Number(order.total))}
              </strong>{" "}
              for order{" "}
              <strong className="text-foreground font-mono font-semibold">
                #{order.order_number}
              </strong>{" "}
              is officially visible in your statement before marking this order
              as Paid.
            </p>
          </div>
        </div>

        {order.payment_reference && (
          <div className="bg-surface border-border mt-2 flex items-center justify-between rounded border p-3 text-xs">
            <div>
              <span className="text-foreground/70">
                Customer Reported UTR / Txn Reference:{" "}
              </span>
              <strong className="text-foreground font-mono">
                {order.payment_reference}
              </strong>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(order.payment_reference!, "Reference")}
              className="text-foreground/70 hover:text-foreground underline"
            >
              Copy
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left column: Items, Notes, WhatsApp */}
        <div className="space-y-8 lg:col-span-8">
          {/* Items Table */}
          <div className="border-border bg-surface space-y-4 rounded-lg border p-6">
            <h2 className="font-heading text-foreground border-border border-b pb-3 text-lg font-semibold">
              Order Items ({order.items.length})
            </h2>

            <div className="divide-border divide-y">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-3">
                  <div className="border-border bg-page-background relative h-16 w-16 flex-none overflow-hidden rounded border">
                    {item.thumbnailUrl ? (
                      <Image
                        src={item.thumbnailUrl}
                        alt={item.product_name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="text-foreground/40 flex h-full w-full items-center justify-center text-xs">
                        Item
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate text-sm font-semibold">
                      {item.product_name}
                    </p>
                    {item.sku && (
                      <p className="text-foreground/60 font-mono text-xs">
                        SKU: {item.sku}
                      </p>
                    )}
                    <p className="text-foreground/80 mt-0.5 text-xs">
                      {formatINR(Number(item.unit_price))} × {item.quantity}
                    </p>
                  </div>

                  <div className="text-foreground text-sm font-bold">
                    {formatINR(Number(item.line_total))}
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Totals */}
            <div className="border-border space-y-2 border-t pt-4 text-sm">
              <div className="text-foreground/80 flex justify-between">
                <span>Subtotal</span>
                <span>{formatINR(Number(order.subtotal))}</span>
              </div>
              <div className="text-foreground/80 flex justify-between">
                <span>Delivery Charge</span>
                <span>
                  {Number(order.delivery_charge) === 0
                    ? "FREE"
                    : formatINR(Number(order.delivery_charge))}
                </span>
              </div>
              <div className="border-border text-foreground flex justify-between border-t pt-2 text-base font-bold">
                <span>Total Amount</span>
                <span>{formatINR(Number(order.total))}</span>
              </div>
            </div>
          </div>

          {/* Customer Note */}
          {order.customer_note && (
            <div className="border-border bg-surface space-y-2 rounded-lg border p-5">
              <h3 className="text-foreground/70 text-xs font-semibold tracking-wider uppercase">
                Customer Note
              </h3>
              <p className="text-foreground text-sm italic">
                &ldquo;{order.customer_note}&rdquo;
              </p>
            </div>
          )}

          {/* Internal Admin Note */}
          <div className="border-border bg-surface space-y-3 rounded-lg border p-6">
            <h3 className="font-heading text-foreground text-sm font-semibold tracking-wider uppercase">
              Internal Admin Notes
            </h3>
            <textarea
              rows={3}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Private notes (visible to admins only)..."
              className="border-input bg-page-background text-foreground focus-visible:ring-foreground w-full rounded-md border p-3 text-xs focus-visible:ring-1 focus-visible:outline-none sm:text-sm"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={savingNote}
                className="bg-foreground text-background hover:bg-foreground/90 rounded-md px-4 py-2 text-xs font-semibold tracking-wider uppercase disabled:opacity-50"
              >
                {savingNote ? "Saving..." : "Save Note"}
              </button>
            </div>
          </div>

          {/* WhatsApp Quick Actions */}
          <div className="border-border bg-surface space-y-3 rounded-lg border p-6">
            <h3 className="font-heading text-foreground text-sm font-semibold tracking-wider uppercase">
              Direct WhatsApp Communication
            </h3>
            <p className="text-foreground/70 text-xs">
              Open a prefilled WhatsApp conversation with the customer for
              status updates.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href={waPaymentReceived}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md bg-[#25D366] px-3.5 py-2 text-xs font-semibold tracking-wider text-white uppercase hover:bg-[#20BD5A]"
              >
                WhatsApp: Payment Received
              </a>
              <a
                href={waShipped}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md bg-[#25D366] px-3.5 py-2 text-xs font-semibold tracking-wider text-white uppercase hover:bg-[#20BD5A]"
              >
                WhatsApp: Shipped with Tracking
              </a>
              <a
                href={waGeneralUpdate}
                target="_blank"
                rel="noopener noreferrer"
                className="border-border bg-page-background text-foreground hover:bg-surface inline-flex items-center gap-1.5 rounded-md border px-3.5 py-2 text-xs font-semibold tracking-wider uppercase"
              >
                WhatsApp: General Update
              </a>
            </div>
          </div>
        </div>

        {/* Right column: Status Controls & Customer Info */}
        <div className="space-y-8 lg:col-span-4">
          {/* Order Status State Controls */}
          <div className="border-border bg-surface space-y-5 rounded-lg border p-6">
            <h2 className="font-heading text-foreground border-border border-b pb-3 text-base font-semibold">
              Order Status Controls
            </h2>

            <div className="space-y-3">
              {/* Allowed Transitions */}
              {order.status === "pending_payment" && (
                <>
                  <button
                    type="button"
                    onClick={() => handleStatusChange("payment_submitted")}
                    disabled={isUpdating}
                    className="w-full rounded-md bg-blue-600 py-2.5 text-xs font-semibold tracking-wider text-white uppercase hover:bg-blue-700"
                  >
                    Mark as Payment Submitted
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange("paid")}
                    disabled={isUpdating}
                    className="w-full rounded-md bg-emerald-700 py-2.5 text-xs font-semibold tracking-wider text-white uppercase hover:bg-emerald-800"
                  >
                    Confirm & Mark as Paid
                  </button>
                </>
              )}

              {order.status === "payment_submitted" && (
                <>
                  <button
                    type="button"
                    onClick={() => handleStatusChange("paid")}
                    disabled={isUpdating}
                    className="w-full rounded-md bg-emerald-700 py-2.5 text-xs font-semibold tracking-wider text-white uppercase hover:bg-emerald-800"
                  >
                    Confirm Bank Credit & Mark Paid
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange("pending_payment")}
                    disabled={isUpdating}
                    className="border-border bg-page-background hover:bg-surface text-foreground w-full rounded-md border py-2.5 text-xs font-semibold tracking-wider uppercase"
                  >
                    Revert to Awaiting Payment
                  </button>
                </>
              )}

              {order.status === "paid" && (
                <button
                  type="button"
                  onClick={() => handleStatusChange("packed")}
                  disabled={isUpdating}
                  className="w-full rounded-md bg-indigo-600 py-2.5 text-xs font-semibold tracking-wider text-white uppercase hover:bg-indigo-700"
                >
                  Mark as Packed
                </button>
              )}

              {order.status === "packed" && (
                <div className="border-border bg-page-background space-y-3 rounded-md border p-3">
                  <div className="space-y-1">
                    <label className="text-foreground text-[11px] font-semibold tracking-wider uppercase">
                      Courier Partner{" "}
                      <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                      placeholder="e.g. DTDC, Blue Dart, India Post"
                      className="border-input bg-surface text-foreground w-full rounded border p-2 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-foreground text-[11px] font-semibold tracking-wider uppercase">
                      Tracking Number
                    </label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="e.g. TRK12345678"
                      className="border-input bg-surface text-foreground w-full rounded border p-2 font-mono text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStatusChange("shipped")}
                    disabled={isUpdating || !courierName.trim()}
                    className="w-full rounded-md bg-purple-600 py-2.5 text-xs font-semibold tracking-wider text-white uppercase hover:bg-purple-700 disabled:opacity-50"
                  >
                    Mark as Shipped
                  </button>
                </div>
              )}

              {order.status === "shipped" && (
                <button
                  type="button"
                  onClick={() => handleStatusChange("delivered")}
                  disabled={isUpdating}
                  className="w-full rounded-md bg-teal-600 py-2.5 text-xs font-semibold tracking-wider text-white uppercase hover:bg-teal-700"
                >
                  Mark as Delivered
                </button>
              )}

              {/* Cancel Order Section (allowed from all statuses except delivered and cancelled) */}
              {order.status !== "delivered" && order.status !== "cancelled" && (
                <div className="border-border border-t pt-2">
                  {!showCancelPrompt ? (
                    <button
                      type="button"
                      onClick={() => setShowCancelPrompt(true)}
                      className="border-destructive/40 text-destructive hover:bg-destructive/10 w-full rounded-md border py-2 text-xs font-semibold tracking-wider uppercase"
                    >
                      Cancel Order...
                    </button>
                  ) : (
                    <div className="border-destructive/40 bg-destructive/5 space-y-3 rounded-md border p-3">
                      <p className="text-destructive text-xs font-semibold">
                        Are you sure you want to cancel this order?
                      </p>
                      <p className="text-foreground/70 text-[11px]">
                        This will release and restore tracked product inventory
                        back to stock.
                      </p>
                      <input
                        type="text"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Cancel reason (optional)"
                        className="border-input bg-surface text-foreground w-full rounded border p-2 text-xs"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleCancelOrder}
                          disabled={isUpdating}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 flex-1 rounded py-1.5 text-xs font-semibold"
                        >
                          Confirm Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCancelPrompt(false)}
                          className="border-border text-foreground rounded border px-3 py-1.5 text-xs"
                        >
                          Keep
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Customer & Delivery Address Card */}
          <div className="border-border bg-surface space-y-4 rounded-lg border p-6">
            <div className="border-border flex items-center justify-between border-b pb-3">
              <h2 className="font-heading text-foreground text-base font-semibold">
                Customer & Shipping
              </h2>
              <button
                type="button"
                onClick={() => handleCopy(fullAddress, "Full Address")}
                className="text-foreground/70 hover:text-foreground text-xs underline"
              >
                Copy Label
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <p className="text-foreground/60 text-[11px] font-semibold uppercase">
                  Customer Name
                </p>
                <div className="text-foreground flex items-center justify-between font-medium">
                  <span>{order.customer_name}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(order.customer_name, "Name")}
                    className="text-foreground/50 hover:text-foreground text-xs"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <p className="text-foreground/60 text-[11px] font-semibold uppercase">
                  Phone Number
                </p>
                <div className="text-foreground flex items-center justify-between font-mono">
                  <a href={`tel:${order.phone}`} className="hover:underline">
                    {order.phone}
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy(order.phone, "Phone")}
                    className="text-foreground/50 hover:text-foreground text-xs"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {order.email && (
                <div>
                  <p className="text-foreground/60 text-[11px] font-semibold uppercase">
                    Email
                  </p>
                  <div className="text-foreground flex items-center justify-between truncate">
                    <a
                      href={`mailto:${order.email}`}
                      className="truncate hover:underline"
                    >
                      {order.email}
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopy(order.email!, "Email")}
                      className="text-foreground/50 hover:text-foreground ml-2 text-xs"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}

              <div className="border-border space-y-1 border-t pt-2">
                <p className="text-foreground/60 text-[11px] font-semibold uppercase">
                  Address
                </p>
                <p className="text-foreground">{order.address_line_1}</p>
                {order.address_line_2 && (
                  <p className="text-foreground/80">{order.address_line_2}</p>
                )}
                <p className="text-foreground font-medium">
                  {order.city}, {order.state} - {order.pin_code}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
