/**
 * Orders list page — server component.
 * Fetches paginated orders from Prisma, filtered by status via URL search params.
 * Renders: heading, filter bar (client), table with status chip + channel icon, prev/next pagination.
 */

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import StatusChip from "@/components/StatusChip";
import ChannelIcon from "@/components/ChannelIcon";
import OrderFilters from "@/components/orders/OrderFilters";
import { Suspense } from "react";

const PAGE_SIZE = 20;

function formatINR(amount: number | string | { toFixed: (n: number) => string }): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter = params.status ?? "";
  const page = Math.max(0, parseInt(params.page ?? "0", 10) || 0);

  const whereClause = statusFilter ? { status: statusFilter } : {};

  const [orders, totalCount] = await Promise.all([
    prisma.order.findMany({
      where: whereClause,
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: page * PAGE_SIZE,
    }),
    prisma.order.count({ where: whereClause }),
  ]);

  return (
    <div className="space-y-5">
      {/* Page heading */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {totalCount.toLocaleString("en-IN")} total orders
        </p>
      </div>

      {/* Filter bar — client component with Suspense boundary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 px-5 py-3">
        <Suspense fallback={<div className="h-8" />}>
          <OrderFilters
            currentStatus={statusFilter}
            currentPage={page}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
          />
        </Suspense>
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Order #
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Channel
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Customer
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Items
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Total
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5">
                  <Link
                    href={`/orders/${order.id}`}
                    className="font-medium text-blue-600 hover:text-blue-800"
                  >
                    {order.orderNumber}
                  </Link>
                </td>
                <td className="px-5 py-3.5">
                  <ChannelIcon channel={order.channel} />
                </td>
                <td className="px-5 py-3.5 text-gray-700">{order.customerName}</td>
                <td className="px-4 py-3.5 text-gray-500">
                  {order.items.length} {order.items.length === 1 ? "item" : "items"}
                </td>
                <td className="px-4 py-3.5 font-medium text-gray-900">
                  {formatINR(order.totalAmount)}
                </td>
                <td className="px-4 py-3.5">
                  <StatusChip status={order.status} />
                </td>
                <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">
                  {formatDate(order.createdAt)}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-gray-400 text-sm">
                  No orders found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
