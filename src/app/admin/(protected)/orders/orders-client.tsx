"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Order, OrderStatus } from "@/types/orders";
import { formatINR } from "@/lib/utils/currency";

interface OrdersClientProps {
  orders: Order[];
  total: number;
  currentPage: number;
  totalPages: number;
  initialStatus: string;
  initialQuery: string;
}

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
    badgeClass:
      "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 font-bold",
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

export function OrdersClient({
  orders,
  total,
  currentPage,
  totalPages,
  initialStatus,
  initialQuery,
}: OrdersClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [statusFilter, setStatusFilter] = React.useState(initialStatus);
  const [searchQuery, setSearchQuery] = React.useState(initialQuery);

  const updateFilters = (newStatus: string, newQuery: string, page = 1) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newStatus && newStatus !== "all") {
      params.set("status", newStatus);
    } else {
      params.delete("status");
    }

    if (newQuery.trim()) {
      params.set("q", newQuery.trim());
    } else {
      params.delete("q");
    }

    if (page > 1) {
      params.set("page", page.toString());
    } else {
      params.delete("page");
    }

    router.push(`/admin/orders?${params.toString()}`);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setStatusFilter(val);
    updateFilters(val, searchQuery, 1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters(statusFilter, searchQuery, 1);
  };

  const handlePageChange = (newPage: number) => {
    updateFilters(statusFilter, searchQuery, newPage);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-foreground text-2xl font-semibold sm:text-3xl">
            Order Management
          </h1>
          <p className="text-foreground/70 text-xs sm:text-sm">
            Total {total} order{total === 1 ? "" : "s"} found.
          </p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-surface border-border flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex max-w-md flex-1 items-center gap-2"
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order #, name or phone..."
            className="border-input bg-page-background text-foreground focus-visible:ring-foreground w-full rounded-md border px-3 py-1.5 text-xs focus-visible:ring-1 focus-visible:outline-none sm:text-sm"
          />
          <button
            type="submit"
            className="bg-foreground text-background hover:bg-foreground/90 rounded-md px-3.5 py-1.5 text-xs font-semibold tracking-wider uppercase transition-colors"
          >
            Search
          </button>
        </form>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="status-filter"
            className="text-foreground/80 text-xs font-medium whitespace-nowrap"
          >
            Filter Status:
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={handleStatusChange}
            className="border-input bg-page-background text-foreground focus-visible:ring-foreground rounded-md border px-3 py-1.5 text-xs focus-visible:ring-1 focus-visible:outline-none sm:text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="payment_submitted">
              Payment Submitted (To Verify)
            </option>
            <option value="pending_payment">Pending Payment</option>
            <option value="paid">Paid</option>
            <option value="packed">Packed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="border-border bg-surface overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-page-background border-border text-foreground/70 border-b text-[11px] font-semibold tracking-wider uppercase">
              <tr>
                <th className="px-4 py-3 sm:px-6">Order #</th>
                <th className="px-4 py-3 sm:px-6">Date</th>
                <th className="px-4 py-3 sm:px-6">Customer</th>
                <th className="px-4 py-3 sm:px-6">Total</th>
                <th className="px-4 py-3 sm:px-6">Status</th>
                <th className="px-4 py-3 text-right sm:px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-foreground/60 px-6 py-12 text-center"
                  >
                    No orders found matching your filters.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const statusConf = STATUS_CONFIG[
                    order.status as OrderStatus
                  ] || {
                    label: order.status,
                    badgeClass: "bg-muted text-muted-foreground",
                  };
                  const dateStr = new Date(order.created_at).toLocaleDateString(
                    "en-IN",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  );

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-page-background/50 transition-colors"
                    >
                      <td className="text-foreground px-4 py-3 font-mono font-semibold sm:px-6">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="hover:underline"
                        >
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="text-foreground/80 px-4 py-3 whitespace-nowrap sm:px-6">
                        {dateStr}
                      </td>
                      <td className="text-foreground px-4 py-3 sm:px-6">
                        <div className="font-medium">{order.customer_name}</div>
                        <div className="text-foreground/60 font-mono text-xs">
                          {order.phone}
                        </div>
                      </td>
                      <td className="text-foreground px-4 py-3 font-semibold whitespace-nowrap sm:px-6">
                        {formatINR(Number(order.total))}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap sm:px-6">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConf.badgeClass}`}
                        >
                          {statusConf.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right sm:px-6">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-foreground inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                        >
                          View Details →
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-border flex items-center justify-between border-t px-4 py-3 sm:px-6">
            <span className="text-foreground/70 text-xs">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="border-border bg-page-background text-foreground hover:bg-surface rounded border px-2.5 py-1 text-xs font-medium disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="border-border bg-page-background text-foreground hover:bg-surface rounded border px-2.5 py-1 text-xs font-medium disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
