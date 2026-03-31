/**
 * Order detail page — server component.
 * Shows customer info, items table, routing decision card, action buttons, and status timeline.
 * Checks inventory for all order items to determine routing decision.
 */

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import StatusChip from "@/components/StatusChip";
import ChannelIcon from "@/components/ChannelIcon";
import OrderActions from "@/components/orders/OrderActions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatINR(amount: any): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const STATUS_STEPS = [
  { key: "new", label: "Order Received" },
  { key: "routed", label: "Routed" },
  { key: "picking", label: "Picking" },
  { key: "packing", label: "Packing" },
  { key: "dispatched", label: "Dispatched" },
  { key: "shipped", label: "Shipped" },
];

function getStepIndex(status: string): number {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          sku: {
            include: { inventory: true },
          },
        },
      },
      pickList: { include: { items: true } },
      productionJob: true,
    },
  });

  if (!order) notFound();

  const currentStepIndex = getStepIndex(order.status);

  // Determine routing: check stock for each item
  const stockCheckResults = order.items.map((item) => {
    const inStock = item.sku.inventory?.inStock ?? 0;
    const isAvailable = inStock >= item.quantity;
    return { item, inStock, isAvailable };
  });

  const allInStock = stockCheckResults.every((r) => r.isAvailable);

  const totalAmount = order.items.reduce(
    (sum, item) => sum + Number(item.unitPrice) * item.quantity,
    0
  );

  return (
    <div className="space-y-5">
      {/* Back link + heading */}
      <div className="flex items-center gap-3">
        <Link href="/orders" className="text-sm text-gray-500 hover:text-gray-700">
          ← Orders
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-semibold text-gray-900">{order.orderNumber}</h1>
        <StatusChip status={order.status} />
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column — 2/3 */}
        <div className="lg:col-span-2 space-y-5">
          {/* Customer Info Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900 mb-3">Customer</h2>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-gray-900">{order.customerName}</p>
                  <p className="text-sm text-gray-500">{order.customerAddress}</p>
                  <p className="text-sm text-gray-500">{order.customerPhone}</p>
                  <p className="text-sm text-gray-400">Ordered {formatDate(order.createdAt)}</p>
                </div>
              </div>
              <ChannelIcon channel={order.channel} />
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Order Items</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Product
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    SKU Code
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Size
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Color
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Qty
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Unit Price
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-3.5 text-gray-900 font-medium">
                      {item.sku.name}
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 font-mono text-xs">
                      {item.sku.skuCode}
                    </td>
                    <td className="px-4 py-3.5 text-gray-600">{item.sku.size}</td>
                    <td className="px-4 py-3.5 text-gray-600">{item.sku.color}</td>
                    <td className="px-4 py-3.5 text-right text-gray-700">{item.quantity}</td>
                    <td className="px-4 py-3.5 text-right text-gray-700">
                      {formatINR(item.unitPrice)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-gray-900">
                      {formatINR(Number(item.unitPrice) * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td colSpan={6} className="px-5 py-3 text-right text-sm font-semibold text-gray-700">
                    Total
                  </td>
                  <td className="px-5 py-3 text-right text-base font-bold text-gray-900">
                    {formatINR(totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Routing Decision Card */}
          <div
            className={`rounded-lg border-2 p-5 ${
              order.routingDecision === "production"
                ? "border-orange-300 bg-orange-50"
                : order.routingDecision === "stock"
                ? "border-green-300 bg-green-50"
                : allInStock
                ? "border-green-300 bg-green-50"
                : "border-orange-300 bg-orange-50"
            }`}
          >
            {/* If already routed, show what was decided */}
            {order.routingDecision === "stock" && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-green-600 text-xl">✓</span>
                  <h2 className="text-base font-bold text-green-800">
                    FULFILL FROM STOCK — Decision confirmed
                  </h2>
                </div>
                <p className="text-sm text-green-700 mb-3">
                  This order has been approved to fulfill from warehouse stock.
                </p>
                <ul className="space-y-1">
                  {stockCheckResults.map(({ item, inStock }) => (
                    <li key={item.id} className="text-sm text-green-700">
                      {item.sku.name} — <span className="font-medium">In stock: {inStock}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {order.routingDecision === "production" && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-orange-600 text-xl">⚠</span>
                  <h2 className="text-base font-bold text-orange-800">
                    SENT TO PRODUCTION — Decision confirmed
                  </h2>
                </div>
                <p className="text-sm text-orange-700 mb-3">
                  This order has been routed to the production queue.
                </p>
                <ul className="space-y-1">
                  {stockCheckResults.map(({ item, inStock, isAvailable }) => (
                    <li key={item.id} className="text-sm text-orange-700">
                      {item.sku.name} — In stock: {inStock}, Need: {item.quantity}
                      {!isAvailable && (
                        <span className="ml-1 font-semibold text-orange-800">(Insufficient)</span>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* Not yet routed — show real-time stock check */}
            {!order.routingDecision && allInStock && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-green-600 text-xl">✓</span>
                  <h2 className="text-base font-bold text-green-800">
                    FULFILL FROM STOCK — All items available in warehouse
                  </h2>
                </div>
                <ul className="space-y-1">
                  {stockCheckResults.map(({ item, inStock }) => (
                    <li key={item.id} className="text-sm text-green-700">
                      {item.sku.name} —{" "}
                      <span className="font-medium">In stock: {inStock}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {!order.routingDecision && !allInStock && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-orange-600 text-xl">⚠</span>
                  <h2 className="text-base font-bold text-orange-800">
                    SEND TO PRODUCTION — Some items unavailable
                  </h2>
                </div>
                <ul className="space-y-1">
                  {stockCheckResults.map(({ item, inStock, isAvailable }) => (
                    <li key={item.id} className="text-sm text-orange-700">
                      {item.sku.name} — In stock: {inStock}, Need: {item.quantity}
                      {!isAvailable && (
                        <span className="ml-1 font-semibold text-orange-800">(Insufficient)</span>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <OrderActions
            orderId={order.id}
            status={order.status}
            routingDecision={order.routingDecision}
          />
        </div>

        {/* Right column — 1/3 */}
        <div className="space-y-5">
          {/* Status Timeline */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-5">Order Timeline</h2>
            <div className="relative">
              {STATUS_STEPS.map((step, index) => {
                const isDone = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const isFuture = index > currentStepIndex;
                const isLast = index === STATUS_STEPS.length - 1;

                return (
                  <div key={step.key} className="flex gap-3">
                    {/* Circle + line column */}
                    <div className="flex flex-col items-center">
                      {/* Circle */}
                      {isDone && (
                        <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      {isCurrent && (
                        <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center shrink-0 ring-4 ring-blue-100">
                          <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                        </div>
                      )}
                      {isFuture && (
                        <div className="w-7 h-7 rounded-full border-2 border-gray-200 bg-white shrink-0" />
                      )}

                      {/* Connecting line */}
                      {!isLast && (
                        <div
                          className={`w-0.5 flex-1 my-1 min-h-[20px] ${
                            isDone ? "bg-green-400" : "border-l-2 border-dashed border-gray-200"
                          }`}
                        />
                      )}
                    </div>

                    {/* Label */}
                    <div className="pb-5">
                      <p
                        className={`text-sm font-medium ${
                          isDone
                            ? "text-green-700"
                            : isCurrent
                            ? "text-blue-700"
                            : "text-gray-400"
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order summary card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Summary</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Order Number</dt>
                <dd className="font-medium text-gray-900">{order.orderNumber}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Channel</dt>
                <dd className="capitalize text-gray-900">{order.channel}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Items</dt>
                <dd className="text-gray-900">{order.items.length}</dd>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2">
                <dt className="font-semibold text-gray-700">Total</dt>
                <dd className="font-bold text-gray-900">{formatINR(totalAmount)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
