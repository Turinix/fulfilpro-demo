/**
 * Warehouse Hub — server component.
 * Displays 3 queue cards (Pick / Pack / Dispatch counts) and 3 full queue sections below.
 * Pick Queue: orders with status 'picking'. Links to /warehouse/pick/[orderId].
 * Pack Queue: orders with status 'packing'. Links to /warehouse/pack/[orderId].
 * Dispatch Queue: shipments with status 'packed'. Per-row "Mark Dispatched" + bulk "Dispatch All".
 */

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import StatusChip from "@/components/StatusChip";
import DispatchActions from "@/components/warehouse/DispatchActions";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function WarehousePage() {
  const [pickingOrders, packingOrders, packedShipments] = await Promise.all([
    prisma.order.findMany({
      where: { status: "picking" },
      include: { items: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.order.findMany({
      where: { status: "packing" },
      include: { items: true, pickList: true },
      orderBy: { updatedAt: "asc" },
    }),
    prisma.shipment.findMany({
      where: { status: "packed" },
      include: { order: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const queueCards = [
    {
      label: "Pick Queue",
      count: pickingOrders.length,
      description: "Orders ready to pick",
      bg: "bg-yellow-50",
      border: "border-l-yellow-500",
      text: "text-yellow-700",
      href: "#pick-queue",
    },
    {
      label: "Pack Queue",
      count: packingOrders.length,
      description: "Picked, awaiting packing",
      bg: "bg-orange-50",
      border: "border-l-orange-500",
      text: "text-orange-700",
      href: "#pack-queue",
    },
    {
      label: "Ready to Dispatch",
      count: packedShipments.length,
      description: "Packed, label generated",
      bg: "bg-indigo-50",
      border: "border-l-indigo-500",
      text: "text-indigo-700",
      href: "#dispatch-queue",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Warehouse Operations</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage the full pick → pack → dispatch workflow</p>
      </div>

      {/* Queue summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {queueCards.map((card) => (
          <a
            key={card.label}
            href={card.href}
            className={`${card.bg} rounded-lg border-l-4 ${card.border} px-5 py-4 block hover:opacity-90 transition-opacity`}
          >
            <p className={`text-4xl font-bold ${card.text}`}>{card.count}</p>
            <p className="text-sm font-semibold text-gray-700 mt-1">{card.label}</p>
            <p className="text-xs text-gray-500">{card.description}</p>
          </a>
        ))}
      </div>

      {/* ── Pick Queue section ── */}
      <section id="pick-queue">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">
            Pick Queue
            <span className="ml-2 text-sm font-normal text-gray-500">({pickingOrders.length})</span>
          </h2>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Order #</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Items</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pickingOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-900">{order.orderNumber}</td>
                  <td className="px-4 py-3.5 text-gray-700">{order.customerName}</td>
                  <td className="px-4 py-3.5 text-gray-500">
                    {order.items.length} {order.items.length === 1 ? "item" : "items"}
                  </td>
                  <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/warehouse/pick/${order.id}`}
                      className="inline-flex items-center px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
                    >
                      Start Picking →
                    </Link>
                  </td>
                </tr>
              ))}
              {pickingOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">
                    No orders in pick queue
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Pack Queue section ── */}
      <section id="pack-queue">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">
            Pack Queue
            <span className="ml-2 text-sm font-normal text-gray-500">({packingOrders.length})</span>
          </h2>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Order #</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Items</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Picked At</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {packingOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-900">{order.orderNumber}</td>
                  <td className="px-4 py-3.5 text-gray-700">{order.customerName}</td>
                  <td className="px-4 py-3.5 text-gray-500">
                    {order.items.length} {order.items.length === 1 ? "item" : "items"}
                  </td>
                  <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">
                    {order.updatedAt ? formatDate(order.updatedAt) : "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/warehouse/pack/${order.id}`}
                      className="inline-flex items-center px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
                    >
                      Pack Order →
                    </Link>
                  </td>
                </tr>
              ))}
              {packingOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">
                    No orders in pack queue
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Dispatch Queue section ── */}
      <section id="dispatch-queue">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">
            Dispatch Queue
            <span className="ml-2 text-sm font-normal text-gray-500">({packedShipments.length})</span>
          </h2>
          {packedShipments.length > 0 && (
            <DispatchActions mode="bulk" />
          )}
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Order #</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Courier</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">AWB #</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Package Size</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Packed At</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {packedShipments.map((shipment) => (
                <tr key={shipment.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-900">{shipment.order.orderNumber}</td>
                  <td className="px-4 py-3.5 text-gray-700">{shipment.courier}</td>
                  <td className="px-4 py-3.5 text-gray-500 font-mono text-xs">{shipment.awbNumber}</td>
                  <td className="px-4 py-3.5 text-gray-600 capitalize">{shipment.packageSize}</td>
                  <td className="px-4 py-3.5">
                    <StatusChip status={shipment.status} />
                  </td>
                  <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">{formatDate(shipment.createdAt)}</td>
                  <td className="px-4 py-3.5">
                    <DispatchActions mode="single" shipmentId={shipment.id} />
                  </td>
                </tr>
              ))}
              {packedShipments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-400 text-sm">
                    No shipments ready for dispatch
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
