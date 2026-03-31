/**
 * Returns list page — server component.
 * Fetches all Return records from Prisma and computes status summary counts.
 * Renders: heading with "Simulate Return" button, 4 summary cards, returns table.
 * Each row links to /returns/[id]. Status chip reused from StatusChip.
 */

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import StatusChip from "@/components/StatusChip";
import SimulateReturnButton from "@/components/returns/SimulateReturnButton";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ReturnsPage() {
  const returns = await prisma.return.findMany({
    orderBy: { createdAt: "desc" },
    include: { order: { select: { orderNumber: true } } },
  });

  const counts = {
    requested: returns.filter((r) => r.status === "requested").length,
    approved: returns.filter((r) => r.status === "approved").length,
    received: returns.filter((r) => r.status === "received").length,
    refunded: returns.filter((r) => r.status === "refunded").length,
  };

  const summaryCards = [
    { label: "Requested", count: counts.requested, color: "bg-blue-50 text-blue-700 border-blue-100" },
    { label: "Approved", count: counts.approved, color: "bg-purple-50 text-purple-700 border-purple-100" },
    { label: "Received", count: counts.received, color: "bg-amber-50 text-amber-700 border-amber-100" },
    { label: "Refunded", count: counts.refunded, color: "bg-gray-50 text-gray-700 border-gray-100" },
  ];

  return (
    <div className="space-y-5">
      {/* Page heading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Returns</h1>
          <p className="text-sm text-gray-500 mt-0.5">{returns.length} total returns</p>
        </div>
        <SimulateReturnButton />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-lg border p-4 ${card.color}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{card.label}</p>
            <p className="text-3xl font-bold mt-1">{card.count}</p>
          </div>
        ))}
      </div>

      {/* Returns table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                RMA #
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Order #
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Customer
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Reason
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
            {returns.map((ret) => (
              <tr key={ret.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5">
                  <Link
                    href={`/returns/${ret.id}`}
                    className="font-medium text-blue-600 hover:text-blue-800 font-mono"
                  >
                    {ret.rmaNumber}
                  </Link>
                </td>
                <td className="px-5 py-3.5">
                  <Link
                    href={`/orders/${ret.orderId}`}
                    className="text-blue-600 hover:text-blue-800 font-mono"
                  >
                    {ret.order.orderNumber}
                  </Link>
                </td>
                <td className="px-5 py-3.5 text-gray-700">{ret.customerName}</td>
                <td className="px-4 py-3.5 text-gray-500">{ret.reason}</td>
                <td className="px-4 py-3.5">
                  <StatusChip status={ret.status} />
                </td>
                <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">
                  {formatDate(ret.createdAt)}
                </td>
              </tr>
            ))}
            {returns.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-sm">
                  No returns yet — click &quot;Simulate Return&quot; to create one
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
