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

export function OrderDetailClient({ order: initialOrder, siteUrl }: OrderDetailClientProps) {
  const router = useRouter();
  const [order, setOrder] = React.useState<OrderDetailWithItems>(initialOrder);
  const [isUpdating, setIsUpdating] = React.useState(false);

  // Shipped details inputs
  const [courierName, setCourierName] = React.useState(order.courier_name || "");
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
      (trackingNumber || order.tracking_number)
        ? `Tracking Number: ${trackingNumber || order.tracking_number}`
        : "",
      `Order tracking details: ${orderCustomerUrl}`,
    ],
  });

  const waGeneralUpdate = buildWhatsAppLink({
    phoneNumber: order.phone,
    greeting: `Hello ${order.customer_name}! Update regarding your Nandhini Makeup & Jewellery order #${order.order_number}:`,
    extraLines: [
      `Status: ${order.status}`,
      `Order link: ${orderCustomerUrl}`,
    ],
  });

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      {/* Header and Back Link */}
      <div>
        <Link
          href="/admin/orders"
          className="text-foreground/70 hover:text-foreground text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1 mb-2"
        >
          ← Back to All Orders
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-foreground text-2xl font-semibold sm:text-3xl">
              Order #{order.order_number}
            </h1>
            <p className="text-foreground/60 text-xs mt-1">
              Placed on{" "}
              {new Date(order.created_at).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>

          <div>
            <span
              className={`inline-flex items-center rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider ${
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
      <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-5 space-y-3">
        <div className="flex items-start gap-3">
          <span className="text-amber-600 text-lg">⚠️</span>
          <div className="space-y-1">
            <h2 className="font-semibold text-sm text-foreground">
              Bank / UPI App Credit Verification Reminder
            </h2>
            <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
              Always open your own bank account or UPI app (Google Pay, PhonePe, Paytm, etc.) and confirm that a credit of{" "}
              <strong className="text-foreground font-semibold">
                {formatINR(Number(order.total))}
              </strong>{" "}
              for order{" "}
              <strong className="font-mono text-foreground font-semibold">
                #{order.order_number}
              </strong>{" "}
              is officially visible in your statement before marking this order as Paid.
            </p>
          </div>
        </div>

        {order.payment_reference && (
          <div className="mt-2 rounded bg-surface p-3 border border-border flex items-center justify-between text-xs">
            <div>
              <span className="text-foreground/70">Customer Reported UTR / Txn Reference: </span>
              <strong className="font-mono text-foreground">{order.payment_reference}</strong>
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
        <div className="lg:col-span-8 space-y-8">
          {/* Items Table */}
          <div className="border border-border rounded-lg bg-surface p-6 space-y-4">
            <h2 className="font-heading text-foreground text-lg font-semibold border-b border-border pb-3">
              Order Items ({order.items.length})
            </h2>

            <div className="divide-y divide-border">
              {order.items.map((item) => (
                <div key={item.id} className="py-3 flex items-center gap-4">
                  <div className="relative h-16 w-16 flex-none rounded border border-border bg-page-background overflow-hidden">
                    {item.thumbnailUrl ? (
                      <Image
                        src={item.thumbnailUrl}
                        alt={item.product_name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-foreground/40 text-xs">
                        Item
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {item.product_name}
                    </p>
                    {item.sku && (
                      <p className="text-xs text-foreground/60 font-mono">
                        SKU: {item.sku}
                      </p>
                    )}
                    <p className="text-xs text-foreground/80 mt-0.5">
                      {formatINR(Number(item.unit_price))} × {item.quantity}
                    </p>
                  </div>

                  <div className="text-sm font-bold text-foreground">
                    {formatINR(Number(item.line_total))}
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Totals */}
            <div className="border-t border-border pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-foreground/80">
                <span>Subtotal</span>
                <span>{formatINR(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between text-foreground/80">
                <span>Delivery Charge</span>
                <span>
                  {Number(order.delivery_charge) === 0
                    ? "FREE"
                    : formatINR(Number(order.delivery_charge))}
                </span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between text-base font-bold text-foreground">
                <span>Total Amount</span>
                <span>{formatINR(Number(order.total))}</span>
              </div>
            </div>
          </div>

          {/* Customer Note */}
          {order.customer_note && (
            <div className="border border-border rounded-lg bg-surface p-5 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/70">
                Customer Note
              </h3>
              <p className="text-sm text-foreground italic">
                &ldquo;{order.customer_note}&rdquo;
              </p>
            </div>
          )}

          {/* Internal Admin Note */}
          <div className="border border-border rounded-lg bg-surface p-6 space-y-3">
            <h3 className="font-heading text-sm font-semibold text-foreground uppercase tracking-wider">
              Internal Admin Notes
            </h3>
            <textarea
              rows={3}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Private notes (visible to admins only)..."
              className="border-input bg-page-background text-foreground focus-visible:ring-foreground w-full rounded-md border p-3 text-xs sm:text-sm focus-visible:ring-1 focus-visible:outline-none"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={savingNote}
                className="bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wider"
              >
                {savingNote ? "Saving..." : "Save Note"}
              </button>
            </div>
          </div>

          {/* WhatsApp Quick Actions */}
          <div className="border border-border rounded-lg bg-surface p-6 space-y-3">
            <h3 className="font-heading text-sm font-semibold text-foreground uppercase tracking-wider">
              Direct WhatsApp Communication
            </h3>
            <p className="text-xs text-foreground/70">
              Open a prefilled WhatsApp conversation with the customer for status updates.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href={waPaymentReceived}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#25D366] text-white hover:bg-[#20BD5A] inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold uppercase tracking-wider"
              >
                WhatsApp: Payment Received
              </a>
              <a
                href={waShipped}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#25D366] text-white hover:bg-[#20BD5A] inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold uppercase tracking-wider"
              >
                WhatsApp: Shipped with Tracking
              </a>
              <a
                href={waGeneralUpdate}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-border bg-page-background text-foreground hover:bg-surface inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold uppercase tracking-wider"
              >
                WhatsApp: General Update
              </a>
            </div>
          </div>
        </div>

        {/* Right column: Status Controls & Customer Info */}
        <div className="lg:col-span-4 space-y-8">
          {/* Order Status State Controls */}
          <div className="border border-border rounded-lg bg-surface p-6 space-y-5">
            <h2 className="font-heading text-foreground text-base font-semibold border-b border-border pb-3">
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
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md py-2.5 text-xs font-semibold uppercase tracking-wider"
                  >
                    Mark as Payment Submitted
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange("paid")}
                    disabled={isUpdating}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white rounded-md py-2.5 text-xs font-semibold uppercase tracking-wider"
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
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white rounded-md py-2.5 text-xs font-semibold uppercase tracking-wider"
                  >
                    Confirm Bank Credit & Mark Paid
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange("pending_payment")}
                    disabled={isUpdating}
                    className="w-full border border-border bg-page-background hover:bg-surface text-foreground rounded-md py-2.5 text-xs font-semibold uppercase tracking-wider"
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
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-md py-2.5 text-xs font-semibold uppercase tracking-wider"
                >
                  Mark as Packed
                </button>
              )}

              {order.status === "packed" && (
                <div className="space-y-3 border border-border p-3 rounded-md bg-page-background">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
                      Courier Partner <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                      placeholder="e.g. DTDC, Blue Dart, India Post"
                      className="w-full border border-input rounded bg-surface p-2 text-xs text-foreground"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
                      Tracking Number
                    </label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="e.g. TRK12345678"
                      className="w-full border border-input rounded bg-surface p-2 text-xs text-foreground font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStatusChange("shipped")}
                    disabled={isUpdating || !courierName.trim()}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-md py-2.5 text-xs font-semibold uppercase tracking-wider"
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
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-md py-2.5 text-xs font-semibold uppercase tracking-wider"
                >
                  Mark as Delivered
                </button>
              )}

              {/* Cancel Order Section (allowed from all statuses except delivered and cancelled) */}
              {order.status !== "delivered" && order.status !== "cancelled" && (
                <div className="pt-2 border-t border-border">
                  {!showCancelPrompt ? (
                    <button
                      type="button"
                      onClick={() => setShowCancelPrompt(true)}
                      className="w-full border border-destructive/40 text-destructive hover:bg-destructive/10 rounded-md py-2 text-xs font-semibold uppercase tracking-wider"
                    >
                      Cancel Order...
                    </button>
                  ) : (
                    <div className="space-y-3 p-3 border border-destructive/40 bg-destructive/5 rounded-md">
                      <p className="text-xs font-semibold text-destructive">
                        Are you sure you want to cancel this order?
                      </p>
                      <p className="text-[11px] text-foreground/70">
                        This will release and restore tracked product inventory back to stock.
                      </p>
                      <input
                        type="text"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Cancel reason (optional)"
                        className="w-full border border-input bg-surface p-2 text-xs rounded text-foreground"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleCancelOrder}
                          disabled={isUpdating}
                          className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded py-1.5 text-xs font-semibold"
                        >
                          Confirm Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCancelPrompt(false)}
                          className="border border-border rounded px-3 py-1.5 text-xs text-foreground"
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
          <div className="border border-border rounded-lg bg-surface p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="font-heading text-foreground text-base font-semibold">
                Customer & Shipping
              </h2>
              <button
                type="button"
                onClick={() => handleCopy(fullAddress, "Full Address")}
                className="text-xs text-foreground/70 hover:text-foreground underline"
              >
                Copy Label
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <p className="text-foreground/60 text-[11px] uppercase font-semibold">
                  Customer Name
                </p>
                <div className="flex items-center justify-between text-foreground font-medium">
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
                <p className="text-foreground/60 text-[11px] uppercase font-semibold">
                  Phone Number
                </p>
                <div className="flex items-center justify-between text-foreground font-mono">
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
                  <p className="text-foreground/60 text-[11px] uppercase font-semibold">
                    Email
                  </p>
                  <div className="flex items-center justify-between text-foreground truncate">
                    <a href={`mailto:${order.email}`} className="hover:underline truncate">
                      {order.email}
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopy(order.email!, "Email")}
                      className="text-foreground/50 hover:text-foreground text-xs ml-2"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}

              <div className="border-t border-border pt-2 space-y-1">
                <p className="text-foreground/60 text-[11px] uppercase font-semibold">
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
