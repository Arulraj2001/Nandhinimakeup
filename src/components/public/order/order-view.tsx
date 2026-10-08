"use client";

import * as React from "react";
import Image from "next/image";
import { formatINR } from "@/lib/utils/currency";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";
import { submitCustomerPayment } from "@/lib/actions/orders";
import type { OrderStatus } from "@/types/orders";

interface OrderItemDisplay {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface OrderViewProps {
  orderNumber: string;
  token: string;
  status: OrderStatus;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  customerFirstName: string;
  city: string;
  state: string;
  courierName?: string | null;
  trackingNumber?: string | null;
  items: OrderItemDisplay[];
  qrSvg?: string | null;
  upiUrl?: string | null;
  upiId?: string | null;
  staticQrUrl?: string | null;
  whatsappNumber: string;
  businessName: string;
  orderUrl: string;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment",
  payment_submitted: "Payment received and being verified",
  paid: "Payment confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function OrderView({
  orderNumber,
  token,
  status: initialStatus,
  subtotal,
  deliveryCharge,
  total,
  customerFirstName,
  city,
  state,
  courierName,
  trackingNumber,
  items,
  qrSvg,
  upiUrl,
  upiId,
  staticQrUrl,
  whatsappNumber,
  businessName,
  orderUrl,
}: OrderViewProps) {
  const [status, setStatus] = React.useState<OrderStatus>(initialStatus);
  const [copiedUpi, setCopiedUpi] = React.useState(false);
  const [reference, setReference] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = React.useState(
    initialStatus === "payment_submitted"
  );

  const friendlyStatus = STATUS_LABELS[status] || status;

  const handleCopyUpi = () => {
    if (!upiId) return;
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 3000);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await submitCustomerPayment({
      orderNumber,
      token,
      reference: reference.trim() || undefined,
    });

    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.error || "Failed to submit reference. Please try again.");
      return;
    }

    setStatus("payment_submitted");
    setSubmittedSuccess(true);
  };

  // WhatsApp screenshot message
  const screenshotWhatsAppUrl = buildWhatsAppLink({
    phoneNumber: whatsappNumber,
    greeting: `Hello ${businessName}! I have made the UPI payment for my order.`,
    extraLines: [
      `Order: ${orderNumber}`,
      `Total: ${formatINR(total)}`,
      `Name: ${customerFirstName}`,
      `Order Link: ${orderUrl}`,
      `Attaching payment screenshot below:`,
    ],
  });

  // General enquiry WhatsApp link for any status
  const generalEnquiryWhatsAppUrl = buildWhatsAppLink({
    phoneNumber: whatsappNumber,
    greeting: `Hello ${businessName}! I would like to check about my order:`,
    extraLines: [
      `Order: ${orderNumber}`,
      `Status: ${friendlyStatus}`,
      `Name: ${customerFirstName}`,
      `Order Link: ${orderUrl}`,
    ],
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Order Header */}
      <div className="border-border border-b pb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-foreground/60 text-xs font-semibold tracking-wider uppercase">
              Order Confirmation
            </span>
            <h1 className="font-heading text-foreground mt-1 text-2xl font-semibold sm:text-3xl">
              Order #{orderNumber}
            </h1>
          </div>

          <div>
            <span
              className={`inline-flex items-center rounded-full px-3.5 py-1 text-xs font-semibold ${
                status === "paid" || status === "delivered"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : status === "payment_submitted" ||
                      status === "packed" ||
                      status === "shipped"
                    ? "bg-blue-100 text-blue-800 border border-blue-300"
                    : status === "cancelled"
                      ? "bg-rose-100 text-rose-800 border border-rose-300"
                      : "bg-amber-100 text-amber-800 border border-amber-300"
              }`}
            >
              {friendlyStatus}
            </span>
          </div>
        </div>

        <p className="text-foreground/70 mt-3 text-xs sm:text-sm">
          Thank you,{" "}
          <span className="text-foreground font-medium">
            {customerFirstName}
          </span>
          ! Delivery to{" "}
          <span className="text-foreground font-medium">
            {city}, {state}
          </span>
          .
        </p>

        {/* Courier / Shipping details once shipped */}
        {courierName && (
          <div className="text-foreground mt-4 rounded-md border border-blue-500/30 bg-blue-500/10 p-3.5 text-xs">
            <p className="font-semibold text-blue-900">
              Courier Tracking Details
            </p>
            <p className="mt-1">
              Courier: <span className="font-medium">{courierName}</span>
              {trackingNumber ? (
                <>
                  {" "}
                  • Tracking Number:{" "}
                  <span className="font-mono font-medium">
                    {trackingNumber}
                  </span>
                </>
              ) : null}
            </p>
          </div>
        )}
      </div>

      {/* Payment Section (when pending_payment) */}
      {status === "pending_payment" && (
        <div className="border-border bg-surface mt-8 space-y-6 rounded-lg border p-6 sm:p-8">
          <div className="border-border border-b pb-4">
            <h2 className="font-heading text-foreground text-xl font-semibold">
              Complete Payment via UPI
            </h2>
            <p className="text-foreground/70 mt-1 text-xs sm:text-sm">
              Please pay the exact order amount via your preferred UPI app
              (Google Pay, PhonePe, Paytm, BHIM, etc.).
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-center">
            {/* QR Code Presentation */}
            <div className="flex flex-col items-center text-center">
              {qrSvg ? (
                <div
                  className="border-border rounded-lg border bg-white p-3 shadow-xs"
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
              ) : staticQrUrl ? (
                <div className="border-border relative h-60 w-60 overflow-hidden rounded-lg border bg-white p-2">
                  <Image
                    src={staticQrUrl}
                    alt="UPI QR Code"
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="border-border bg-page-background text-foreground/80 rounded-lg border p-6 text-xs">
                  <p className="font-medium">Direct UPI details:</p>
                  <p className="mt-1">
                    Please message us on WhatsApp below for current bank / UPI
                    transfer details.
                  </p>
                </div>
              )}

              {/* Exact Amount & Note */}
              <div className="mt-4 space-y-1">
                <p className="text-foreground/70 text-xs font-semibold tracking-wider uppercase">
                  Amount to Pay
                </p>
                <p className="font-heading text-foreground text-2xl font-bold">
                  {formatINR(total)}
                </p>
              </div>

              {upiId && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-foreground/80 bg-page-background border-border rounded border px-2.5 py-1 font-mono text-xs">
                    {upiId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="border-border bg-surface hover:bg-page-background text-foreground rounded border px-2.5 py-1 text-xs transition-colors"
                  >
                    {copiedUpi ? "Copied!" : "Copy"}
                  </button>
                </div>
              )}

              {/* Pay with UPI App (small screens only) */}
              {upiUrl && (
                <div className="mt-4 block w-full sm:hidden">
                  <a
                    href={upiUrl}
                    className="bg-foreground text-background hover:bg-foreground/90 inline-flex w-full items-center justify-center rounded-md px-4 py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors"
                  >
                    Pay with UPI App
                  </a>
                </div>
              )}
            </div>

            {/* Step-by-Step Payment Instructions */}
            <div className="space-y-4">
              <h3 className="text-foreground text-sm font-semibold tracking-wider uppercase">
                Steps to Pay:
              </h3>
              <ol className="text-foreground/80 space-y-3 text-xs sm:text-sm">
                <li className="flex items-start gap-2.5">
                  <span className="bg-foreground text-background flex h-5 w-5 flex-none items-center justify-center rounded-full text-[10px] font-bold">
                    1
                  </span>
                  <span>
                    Scan the QR code or send payment of{" "}
                    <strong className="text-foreground font-semibold">
                      {formatINR(total)}
                    </strong>{" "}
                    to {upiId || "our UPI ID"}.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="bg-foreground text-background flex h-5 w-5 flex-none items-center justify-center rounded-full text-[10px] font-bold">
                    2
                  </span>
                  <span>
                    Mention{" "}
                    <strong className="text-foreground font-mono font-semibold">
                      {orderNumber}
                    </strong>{" "}
                    in the payment note / remarks.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="bg-foreground text-background flex h-5 w-5 flex-none items-center justify-center rounded-full text-[10px] font-bold">
                    3
                  </span>
                  <span>
                    Share the payment screenshot on WhatsApp so we can verify
                    and begin packing!
                  </span>
                </li>
              </ol>

              {/* WhatsApp Screenshot Button */}
              <div className="pt-2">
                <a
                  href={screenshotWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#25D366] px-4 py-3 text-xs font-semibold tracking-wider text-white uppercase transition-colors hover:bg-[#20BD5A]"
                >
                  Send Payment Screenshot on WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* "I have paid" Form */}
          <div className="border-border border-t pt-6">
            <h3 className="text-foreground text-sm font-semibold">
              Already Completed the Transfer?
            </h3>
            <p className="text-foreground/70 mt-1 text-xs">
              Submit your UPI reference number (UTR / Txn ID) below to notify
              us.
            </p>

            {errorMsg && (
              <p className="text-destructive mt-2 text-xs font-medium">
                {errorMsg}
              </p>
            )}

            <form
              onSubmit={handlePaymentSubmit}
              className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="UPI Reference / UTR (optional, 8-30 alphanumeric)"
                maxLength={30}
                className="border-input bg-page-background text-foreground focus-visible:ring-foreground flex-1 rounded-md border px-3 py-2 font-mono text-xs focus-visible:ring-1 focus-visible:outline-none sm:text-sm"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-foreground text-background hover:bg-foreground/90 inline-flex items-center justify-center rounded-md px-5 py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "I Have Paid"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Banner when payment_submitted */}
      {(status === "payment_submitted" || submittedSuccess) && (
        <div className="text-foreground mt-8 space-y-2 rounded-lg border border-blue-500/30 bg-blue-500/10 p-6 text-sm">
          <p className="font-semibold text-blue-950">
            Payment Details Received
          </p>
          <p className="text-foreground/80 text-xs leading-relaxed sm:text-sm">
            Thank you! We have logged your payment notification. Our team will
            verify the incoming transfer in our bank app and update your order
            to confirmed shortly.
          </p>
          <div className="pt-2">
            <a
              href={screenshotWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-[#25D366] px-4 py-2 text-xs font-semibold tracking-wider text-white uppercase hover:bg-[#20BD5A]"
            >
              Send Screenshot on WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* Order Items Table */}
      <div className="border-border bg-surface mt-8 space-y-6 rounded-lg border p-6 sm:p-8">
        <h2 className="font-heading text-foreground border-border border-b pb-3 text-lg font-semibold">
          Order Summary
        </h2>

        <div className="divide-border divide-y text-xs sm:text-sm">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 py-3"
            >
              <div>
                <p className="text-foreground font-medium">
                  {item.product_name}
                </p>
                <p className="text-foreground/60 text-xs">
                  Qty: {item.quantity} × {formatINR(item.unit_price)}
                </p>
              </div>
              <div className="text-foreground font-semibold">
                {formatINR(item.line_total)}
              </div>
            </div>
          ))}
        </div>

        <div className="border-border space-y-2 border-t pt-4 text-xs sm:text-sm">
          <div className="text-foreground/80 flex justify-between">
            <span>Subtotal</span>
            <span>{formatINR(subtotal)}</span>
          </div>
          <div className="text-foreground/80 flex justify-between">
            <span>Delivery</span>
            <span>
              {deliveryCharge === 0 ? "FREE" : formatINR(deliveryCharge)}
            </span>
          </div>
          <div className="border-border text-foreground flex justify-between border-t pt-2 text-sm font-semibold sm:text-base">
            <span>Total Paid / Payable</span>
            <span>{formatINR(total)}</span>
          </div>
        </div>
      </div>

      {/* Order Support Button */}
      <div className="mt-8 space-y-3 text-center">
        <a
          href={generalEnquiryWhatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="border-border bg-surface hover:bg-page-background text-foreground inline-flex items-center justify-center rounded-md border px-5 py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors"
        >
          Contact Us About This Order on WhatsApp
        </a>
      </div>
    </div>
  );
}
