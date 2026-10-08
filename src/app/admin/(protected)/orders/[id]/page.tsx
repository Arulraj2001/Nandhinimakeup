import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getAdminOrderDetail } from "@/lib/actions/orders-admin";
import { OrderDetailClient } from "./order-detail-client";
import { env } from "@/lib/config/env";

interface AdminOrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const instant = false;

export default async function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  await connection();
  const { id } = await params;

  if (!id) {
    notFound();
  }

  const result = await getAdminOrderDetail(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <OrderDetailClient
      order={result.data}
      siteUrl={env.NEXT_PUBLIC_SITE_URL || ""}
    />
  );
}
