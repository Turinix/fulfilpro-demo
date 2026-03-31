/**
 * Dashboard — server component.
 * Queries the DB directly via Prisma for instant render (no client-side fetching).
 * Renders: 4 KPI cards, live order feed, inventory alerts, channel chart, simulate button.
 */

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import StatusChip from "@/components/StatusChip";
import ChannelIcon from "@/components/ChannelIcon";
import ChannelChart from "@/components/dashboard/ChannelChart";
import SimulateOrderButton from "@/components/dashboard/SimulateOrderButton";

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function DashboardPage() {
  const todayStart = startOfToday();

  const [
    ordersToday,
    pendingFulfilment,
    inProduction,
    shippedToday,
    recentOrders,
    lowStockAlerts,
    channelCounts,
  ] = await Promise.all([
    // Orders created today
    prisma.order.count({
      where: { createdAt: { gte: todayStart } },
    }),
    // Pending fulfilment: new or routed
    prisma.order.count({
      where: { status: { in: ["new", "routed"] } },
    }),
    // In production: queued or in_production
    prisma.productionJob.count({
      where: { status: { in: ["queued", "in_production"] } },
    }),
    // Shipped today
    prisma.order.count({
      where: { status: "shipped", updatedAt: { gte: todayStart } },
    }),
    // 10 most recent orders with items + SKU
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        items: { include: { sku: true } },
      },
    }),
    // SKUs where inStock < reorderPoint — using raw SQL for field-to-field comparison
    prisma.$queryRaw<
      Array<{
        id: string;
        inStock: number;
        reorderPoint: number;
        aisle: string;
        shelf: number;
        bin: number;
        skuId: string;
        sku: { name: string; skuCode: string };
      }>
    >`
      SELECT i.id, i."inStock", i."reorderPoint", i.aisle, i.shelf, i.bin, i."skuId",
             json_build_object('name', s.name, 'skuCode', s."skuCode") as sku
      FROM "Inventory" i
      JOIN "SKU" s ON s.id = i."skuId"
      WHERE i."inStock" < i."reorderPoint"
      ORDER BY i."inStock" ASC
      LIMIT 10
    `,
    // Channel counts
    prisma.order.groupBy({
      by: ["channel"],
      _count: { id: true },
    }),
  ]);

  // Build channel chart data
  const channelData = channelCounts.map((c) => ({
    channel: c.channel,
    count: c._count.id,
  }));

  // KPI card config
  const kpiCards = [
    {
      label: "Orders Today",
      value: ordersToday,
      borderColor: "border-l-blue-500",
      textColor: "text-blue-600",
      bg: "bg-blue-50",
      icon: (
        <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
    {
      label: "Pending Fulfilment",
      value: pendingFulfilment,
      borderColor: "border-l-yellow-500",
      textColor: "text-yellow-600",
      bg: "bg-yellow-50",
      icon: (
        <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "In Production",
      value: inProduction,
      borderColor: "border-l-orange-500",
      textColor: "text-orange-600",
      bg: "bg-orange-50",
      icon: (
        <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
    },
    {
      label: "Shipped Today",
      value: shippedToday,
      borderColor: "border-l-green-500",
      textColor: "text-green-600",
      bg: "bg-green-50",
      icon: (
        <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Overview</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <SimulateOrderButton />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className={`bg-white rounded-lg shadow-sm border-l-4 ${card.borderColor} p-5 flex items-start gap-4`}
          >
            <div className={`p-2 rounded-lg ${card.bg}`}>{card.icon}</div>
            <div>
              <p className={`text-3xl font-bold ${card.textColor}`}>{card.value}</p>
              <p className="text-sm text-gray-500 mt-0.5 leading-tight">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Order Feed — 2/3 width */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900">Latest Orders</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <ChannelIcon channel={order.channel} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{order.orderNumber}</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-sm text-gray-600 truncate">{order.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">
                      {order.items.length} {order.items.length === 1 ? "item" : "items"}
                    </span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs font-medium text-gray-700">
                      ₹{Number(order.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <StatusChip status={order.status} />
                  <span className="text-xs text-gray-400">{formatRelativeTime(order.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-gray-100">
            <Link href="/orders" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              View all orders →
            </Link>
          </div>
        </div>

        {/* Inventory Alerts — 1/3 width */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900">Low Stock Alerts</h3>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          </div>
          <div className="divide-y divide-gray-50">
            {lowStockAlerts.map((alert) => (
                <div key={alert.id} className="px-5 py-3.5">
                  <p className="text-sm font-medium text-gray-900 leading-tight">{alert.sku.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{alert.sku.skuCode}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs font-semibold text-red-600">Stock: {alert.inStock}</span>
                    <span className="text-xs text-gray-400">Reorder at {alert.reorderPoint}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Aisle {alert.aisle}, Shelf {alert.shelf}, Bin {alert.bin}
                  </p>
                </div>
          ))}
          </div>
          <div className="px-5 py-3 border-t border-gray-100">
            <Link href="/inventory" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              Manage inventory →
            </Link>
          </div>
        </div>
      </div>

      {/* Orders by Channel Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Orders by Channel</h3>
        <ChannelChart channelData={channelData} />
      </div>
    </div>
  );
}
