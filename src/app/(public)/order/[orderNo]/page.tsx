import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicSiteSettings, getPublicMedia } from "@/lib/data/settings";
import { getPublicMediaUrl } from "@/lib/utils/media";
import { timingSafeEqualStr } from "@/lib/actions/orders";
import { buildUpiPayUrl, generateUpiQrSvg } from "@/lib/utils/upi";
import { OrderView } from "@/components/public/order/order-view";
import { env } from "@/lib/config/env";
import type { OrderStatus } from "@/types/orders";

import { buildMetadata } from "@/lib/seo/metadata-builder";

export async function generateMetadata(): Promise<Metadata> {
  const meta = await buildMetadata({
    path: "/order",
    forceNoIndex: true,
    generated: {
      title: "Order Details",
      description: "View your order confirmation and payment instructions.",
    },
  });
  return {
    ...meta,
    referrer: "no-referrer",
  };
}

interface OrderPageProps {
  params: Promise<{
    orderNo: string;
  }>;
  searchParams: Promise<{
    token?: string;
  }>;
}

function OrderSkeleton() {
  return (
    <div className="mx-auto max-w-4xl p-10 text-center">
      <div className="border-border bg-surface inline-flex h-12 w-12 animate-pulse items-center justify-center rounded-full border" />
      <p className="text-foreground/70 mt-4 text-sm">
        Loading your order details...
      </p>
    </div>
  );
}

async function OrderContent({ params, searchParams }: OrderPageProps) {
  // Enforce dynamic request-time rendering
  await connection();

  const { orderNo } = await params;
  const { token } = await searchParams;

  if (!orderNo || !token) {
    notFound();
  }

  const adminClient = createAdminClient();

  // Query order
  const { data: order, error } = await adminClient
    .from("orders")
    .select("*")
    .eq("order_number", orderNo)
    .maybeSingle();

  if (error || !order) {
    notFound();
  }

  // Constant-time comparison on access token
  if (!timingSafeEqualStr(order.access_token, token)) {
    notFound();
  }

  // Query order items
  const { data: orderItems } = await adminClient
    .from("order_items")
    .select("*")
    .eq("order_id", order.id);

  const settings = await getPublicSiteSettings();

  // UPI payment configuration
  let qrSvg: string | null = null;
  let upiUrl: string | null = null;
  let staticQrUrl: string | null = null;

  const upiId = settings.payments.upi_id;
  const payeeName =
    settings.payments.payee_name || settings.business.business_name;

  if (order.status === "pending_payment") {
    if (upiId) {
      upiUrl = buildUpiPayUrl({
        upiId,
        payeeName,
        amount: Number(order.total),
        orderNumber: order.order_number,
      });
      qrSvg = await generateUpiQrSvg(upiUrl);
    } else if (settings.payments.upi_qr_media_id) {
      const media = await getPublicMedia(settings.payments.upi_qr_media_id);
      if (media) {
        staticQrUrl = getPublicMediaUrl(media.storage_path);
      }
    }
  }

  const customerFirstName =
    order.customer_name.trim().split(/\s+/)[0] || "Customer";
  const siteUrl = env.NEXT_PUBLIC_SITE_URL || "";
  const orderUrl = `${siteUrl}/order/${order.order_number}?token=${order.access_token}`;

  const items = (orderItems || []).map((item) => ({
    id: item.id,
    product_name: item.product_name,
    quantity: item.quantity,
    unit_price: Number(item.unit_price),
    line_total: Number(item.line_total),
  }));

  return (
    <OrderView
      orderNumber={order.order_number}
      token={token}
      status={order.status as OrderStatus}
      subtotal={Number(order.subtotal)}
      deliveryCharge={Number(order.delivery_charge)}
      total={Number(order.total)}
      customerFirstName={customerFirstName}
      city={order.city}
      state={order.state}
      courierName={order.courier_name}
      trackingNumber={order.tracking_number}
      items={items}
      qrSvg={qrSvg}
      upiUrl={upiUrl}
      upiId={upiId}
      staticQrUrl={staticQrUrl}
      whatsappNumber={settings.business.whatsapp_number}
      businessName={settings.business.business_name}
      orderUrl={orderUrl}
    />
  );
}

export default function OrderPage({ params, searchParams }: OrderPageProps) {
  return (
    <Suspense fallback={<OrderSkeleton />}>
      <OrderContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
