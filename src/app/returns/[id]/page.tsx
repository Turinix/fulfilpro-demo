/**
 * Return detail page — server component.
 * Fetches a single Return with its associated Order from Prisma.
 * Renders: heading, original order card, return info card, item condition display
 * (visible when status = 'received' or 'refunded'), status timeline, and ReturnActions.
 */

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import StatusChip from "@/components/StatusChip";
import ReturnActions from "@/components/returns/ReturnActions";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const RETURN_STEPS = [
  { key: "requested", label: "Return Requested" },
  { key: "approved", label: "Approved" },
  { key: "received", label: "Received & Inspected" },
  { key: "refunded", label: "Refunded" },
];

function getStepIndex(status: string): number {
  const idx = RETURN_STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

function conditionLabel(condition: string | null): string {
  if (!condition) return "—";
  return condition.charAt(0).toUpperCase() + condition.slice(1);
}

function conditionColor(condition: string | null): string {
  if (condition === "good") return "text-green-700 bg-green-50 border-green-200";
  if (condition === "damaged") return "text-orange-700 bg-orange-50 border-orange-200";
  if (condition === "defective") return "text-red-700 bg-red-50 border-red-200";
  return "text-gray-500";
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReturnDetailPage({ params }: PageProps) {
  const { id } = await params;

  const ret = await prisma.return.findUnique({
    where: { id },
    include: {
      order: true,
    },
  });

  if (!ret) notFound();

  const currentStepIndex = getStepIndex(ret.status);
  const showCondition = ["received", "refunded"].includes(ret.status);

  return (
    <div className="space-y-5">
      {/* Back link + heading */}
      <div className="flex items-center gap-3">
        <Link href="/returns" className="text-sm text-gray-500 hover:text-gray-700">
          ← Returns
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-semibold text-gray-900 font-mono">{ret.rmaNumber}</h1>
        <StatusChip status={ret.status} />
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column — 2/3 */}
        <div className="lg:col-span-2 space-y-5">
          {/* Original Order Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Original Order</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-gray-500 text-xs uppercase tracking-wide font-semibold mb-0.5">Order Number</dt>
                <dd>
                  <Link
                    href={`/orders/${ret.orderId}`}
                    className="font-mono font-medium text-blue-600 hover:text-blue-800"
                  >
                    {ret.order.orderNumber}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 text-xs uppercase tracking-wide font-semibold mb-0.5">Customer</dt>
                <dd className="font-medium text-gray-900">{ret.order.customerName}</dd>
              </div>
              <div>
                <dt className="text-gray-500 text-xs uppercase tracking-wide font-semibold mb-0.5">Channel</dt>
                <dd className="capitalize text-gray-700">{ret.order.channel}</dd>
              </div>
              <div>
                <dt className="text-gray-500 text-xs uppercase tracking-wide font-semibold mb-0.5">Order Date</dt>
                <dd className="text-gray-700">{formatDate(ret.order.createdAt)}</dd>
              </div>
            </dl>
          </div>

          {/* Return Info Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Return Info</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-gray-500 text-xs uppercase tracking-wide font-semibold mb-0.5">Reason</dt>
                <dd className="text-gray-900">{ret.reason}</dd>
              </div>
              <div>
                <dt className="text-gray-500 text-xs uppercase tracking-wide font-semibold mb-0.5">Date Requested</dt>
                <dd className="text-gray-700">{formatDate(ret.createdAt)}</dd>
              </div>
            </dl>
          </div>

          {/* Item Condition — visible once received or later */}
          {showCondition && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Item Condition</h2>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${conditionColor(ret.itemCondition)}`}
              >
                {conditionLabel(ret.itemCondition)}
              </span>
              {ret.itemCondition === "good" && (
                <p className="mt-2 text-xs text-green-700">
                  Item was in good condition — inventory has been restocked automatically.
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <ReturnActions returnId={ret.id} status={ret.status} />
        </div>

        {/* Right column — 1/3 */}
        <div>
          {/* Status Timeline */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-5">Return Timeline</h2>
            <div className="relative">
              {RETURN_STEPS.map((step, index) => {
                const isDone = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const isFuture = index > currentStepIndex;
                const isLast = index === RETURN_STEPS.length - 1;

                return (
                  <div key={step.key} className="flex gap-3">
                    {/* Circle + line column */}
                    <div className="flex flex-col items-center">
                      {isDone && (
                        <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
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
        </div>
      </div>
    </div>
  );
}
