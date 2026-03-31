/**
 * Production Queue page — server component.
 * Fetches all production jobs from Prisma with order + items + SKU.
 * Renders: summary cards (queued/in_production/ready counts), table with per-row actions.
 */

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import StatusChip from "@/components/StatusChip";
import ProductionActions from "@/components/production/ProductionActions";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ProductionPage() {
  const jobs = await prisma.productionJob.findMany({
    include: {
      order: {
        include: {
          items: {
            include: { sku: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const queuedCount = jobs.filter((j) => j.status === "queued").length;
  const inProductionCount = jobs.filter((j) => j.status === "in_production").length;
  const readyCount = jobs.filter((j) => j.status === "ready").length;

  const summaryCards = [
    {
      label: "Queued",
      count: queuedCount,
      bg: "bg-gray-50",
      border: "border-l-gray-400",
      text: "text-gray-600",
    },
    {
      label: "In Production",
      count: inProductionCount,
      bg: "bg-orange-50",
      border: "border-l-orange-500",
      text: "text-orange-600",
    },
    {
      label: "Ready",
      count: readyCount,
      bg: "bg-green-50",
      border: "border-l-green-500",
      text: "text-green-600",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Page heading */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Production Queue</h1>
        <p className="text-sm text-gray-500 mt-0.5">{jobs.length} total jobs</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className={`${card.bg} rounded-lg border-l-4 ${card.border} px-5 py-4`}
          >
            <p className={`text-3xl font-bold ${card.text}`}>{card.count}</p>
            <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Jobs table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Order #
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Items to Produce
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Priority
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Created
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {jobs.map((job) => {
              const itemsSummary = job.order.items
                .map((item) => `${item.sku.name} (×${item.quantity})`)
                .join(", ");

              return (
                <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/orders/${job.order.id}`}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {job.order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 max-w-xs">
                    <span className="line-clamp-2 text-xs leading-relaxed">{itemsSummary}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusChip status={job.priority} />
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusChip status={job.status} />
                  </td>
                  <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">
                    {formatDate(job.createdAt)}
                  </td>
                  <td className="px-4 py-3.5">
                    <ProductionActions jobId={job.id} status={job.status} />
                  </td>
                </tr>
              );
            })}
            {jobs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-sm">
                  No production jobs yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
