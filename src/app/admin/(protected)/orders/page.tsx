import { getAdminOrders } from "@/lib/actions/orders-admin";
import { OrdersClient } from "./orders-client";

interface AdminOrdersPageProps {
  searchParams: Promise<{
    status?: string;
    q?: string;
    page?: string;
  }>;
}

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  const { status, q, page } = await searchParams;
  const currentPage = page ? parseInt(page, 10) : 1;

  const result = await getAdminOrders({
    status: status || "all",
    query: q || "",
    page: isNaN(currentPage) ? 1 : currentPage,
    limit: 15,
  });

  if (!result.success) {
    return (
      <div className="p-6">
        <p className="text-destructive text-sm">{result.error}</p>
      </div>
    );
  }

  return (
    <OrdersClient
      orders={result.data.orders}
      total={result.data.total}
      currentPage={result.data.page}
      totalPages={result.data.totalPages}
      initialStatus={status || "all"}
      initialQuery={q || ""}
    />
  );
}
