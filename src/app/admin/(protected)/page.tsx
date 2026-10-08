import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/types/orders";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; badgeClass: string }
> = {
  pending_payment: {
    label: "Awaiting Payment",
    badgeClass:
      "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  },
  payment_submitted: {
    label: "Payment Submitted",
    badgeClass: "bg-blue-600 text-white font-semibold",
  },
  paid: {
    label: "Paid",
    badgeClass:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  packed: {
    label: "Packed",
    badgeClass:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300",
  },
  shipped: {
    label: "Shipped",
    badgeClass:
      "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300",
  },
  delivered: {
    label: "Delivered",
    badgeClass:
      "bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300",
  },
  cancelled: {
    label: "Cancelled",
    badgeClass:
      "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
  },
};

export const instant = false;

export default async function AdminDashboardPage() {
  await connection();
  const supabase = await createClient();

  // Parallel count queries and recent 5 orders
  const [
    verificationRes,
    awaitingPaymentRes,
    paidToPackRes,
    shippedRes,
    recentOrdersRes,
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "payment_submitted"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_payment"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "paid"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "shipped"),
    supabase
      .from("orders")
      .select("id, order_number, customer_name, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const countVerification = verificationRes.count ?? 0;
  const countAwaitingPayment = awaitingPaymentRes.count ?? 0;
  const countPaidToPack = paidToPackRes.count ?? 0;
  const countShipped = shippedRes.count ?? 0;
  const recentOrders = recentOrdersRes.data ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-8">
      <div>
        <h1 className="font-heading text-foreground text-2xl font-semibold sm:text-3xl">
          Admin Dashboard
        </h1>
        <p className="text-foreground/70 mt-1 text-xs sm:text-sm">
          Overview of customer orders requiring action.
        </p>
      </div>

      {/* Counts Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Orders Awaiting Verification */}
        <Link
          href="/admin/orders?status=payment_submitted"
          className="border-border bg-surface hover:border-foreground/40 block rounded-lg border p-5 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-foreground/70 text-xs font-semibold tracking-wider uppercase">
              Awaiting Verification
            </span>
            <span className="h-2 w-2 rounded-full bg-blue-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-heading text-foreground text-3xl font-bold">
              {countVerification}
            </span>
            <span className="text-foreground/60 text-xs">action needed</span>
          </div>
        </Link>

        {/* Orders Awaiting Payment */}
        <Link
          href="/admin/orders?status=pending_payment"
          className="border-border bg-surface hover:border-foreground/40 block rounded-lg border p-5 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-foreground/70 text-xs font-semibold tracking-wider uppercase">
              Awaiting Payment
            </span>
            <span className="h-2 w-2 rounded-full bg-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-heading text-foreground text-3xl font-bold">
              {countAwaitingPayment}
            </span>
            <span className="text-foreground/60 text-xs">pending UPI</span>
          </div>
        </Link>

        {/* Paid Orders to Pack */}
        <Link
          href="/admin/orders?status=paid"
          className="border-border bg-surface hover:border-foreground/40 block rounded-lg border p-5 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-foreground/70 text-xs font-semibold tracking-wider uppercase">
              Paid to Pack
            </span>
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-heading text-foreground text-3xl font-bold">
              {countPaidToPack}
            </span>
            <span className="text-foreground/60 text-xs">
              ready for packing
            </span>
          </div>
        </Link>

        {/* Orders Shipped */}
        <Link
          href="/admin/orders?status=shipped"
          className="border-border bg-surface hover:border-foreground/40 block rounded-lg border p-5 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-foreground/70 text-xs font-semibold tracking-wider uppercase">
              Orders Shipped
            </span>
            <span className="h-2 w-2 rounded-full bg-purple-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-heading text-foreground text-3xl font-bold">
              {countShipped}
            </span>
            <span className="text-foreground/60 text-xs">in transit</span>
          </div>
        </Link>
      </div>

      {/* Five Most Recent Orders */}
      <div className="border-border bg-surface space-y-4 rounded-lg border p-6">
        <div className="border-border flex items-center justify-between border-b pb-3">
          <h2 className="font-heading text-foreground text-lg font-semibold">
            Recent Orders
          </h2>
          <Link
            href="/admin/orders"
            className="text-foreground text-xs font-semibold tracking-wider uppercase hover:underline"
          >
            View All Orders →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-foreground/60 py-6 text-center text-xs">
            No orders placed yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-page-background border-border text-foreground/70 border-b text-[11px] font-semibold tracking-wider uppercase">
                <tr>
                  <th className="px-4 py-2.5">Order #</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Customer</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {recentOrders.map((ord) => {
                  const statusConf = STATUS_CONFIG[
                    ord.status as OrderStatus
                  ] || {
                    label: ord.status,
                    badgeClass: "bg-muted text-muted-foreground",
                  };
                  const dateStr = new Date(ord.created_at).toLocaleDateString(
                    "en-IN",
                    {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  );

                  return (
                    <tr
                      key={ord.id}
                      className="hover:bg-page-background/50 transition-colors"
                    >
                      <td className="text-foreground px-4 py-3 font-mono font-semibold">
                        <Link
                          href={`/admin/orders/${ord.id}`}
                          className="hover:underline"
                        >
                          {ord.order_number}
                        </Link>
                      </td>
                      <td className="text-foreground/80 px-4 py-3 whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="text-foreground px-4 py-3 font-medium">
                        {ord.customer_name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConf.badgeClass}`}
                        >
                          {statusConf.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/orders/${ord.id}`}
                          className="text-foreground text-xs font-semibold hover:underline"
                        >
                          Details →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
