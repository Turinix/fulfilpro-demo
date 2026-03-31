"use client";

/**
 * Pick List page — mobile-first client component.
 * Dark background (bg-gray-900), large touch targets, prominent location text.
 * Fetches pick list on mount from GET /api/warehouse/pick/[orderId].
 * Per-item "PICKED" button → POST /api/warehouse/pick/[orderId]/item/[itemId].
 * "COMPLETE PICK" → POST /api/warehouse/pick/[orderId]/complete, then redirects to /warehouse.
 * "SCAN BARCODE" → simulated alert.
 * Items are reordered so unpicked items appear first, picked items at bottom (grayed out).
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SkuData {
  name: string;
  skuCode: string;
  size: string;
  color: string;
}

interface OrderItemData {
  quantity: number;
  sku: SkuData;
}

interface PickListItemData {
  id: string;
  location: string;
  picked: boolean;
  orderItem: OrderItemData;
}

interface PickListData {
  id: string;
  order: { orderNumber: string };
  items: PickListItemData[];
}

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default function PickListPage({ params }: PageProps) {
  const router = useRouter();
  const [orderId, setOrderId] = useState<string>("");
  const [pickList, setPickList] = useState<PickListData | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ orderId: id }) => {
      setOrderId(id);
      fetch(`/api/warehouse/pick/${id}`)
        .then((res) => res.json())
        .then(({ data }) => setPickList(data));
    });
  }, [params]);

  const handlePickItem = async (itemId: string) => {
    if (!orderId) return;
    setLoadingItemId(itemId);
    try {
      const res = await fetch(`/api/warehouse/pick/${orderId}/item/${itemId}`, {
        method: "POST",
      });
      if (res.ok) {
        setPickList((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            items: prev.items.map((item) =>
              item.id === itemId ? { ...item, picked: true } : item
            ),
          };
        });
      }
    } finally {
      setLoadingItemId(null);
    }
  };

  const handleCompletePick = async () => {
    if (!orderId) return;
    setIsCompleting(true);
    try {
      const res = await fetch(`/api/warehouse/pick/${orderId}/complete`, { method: "POST" });
      if (res.ok) {
        router.push("/warehouse");
      }
    } finally {
      setIsCompleting(false);
    }
  };

  const handleScanBarcode = () => {
    alert("Barcode scanner connected — scan item to auto-pick");
  };

  if (!pickList) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400 text-lg">Loading pick list...</p>
      </div>
    );
  }

  const totalItems = pickList.items.length;
  const pickedCount = pickList.items.filter((i) => i.picked).length;
  const allPicked = pickedCount === totalItems;
  const progressPct = totalItems > 0 ? Math.round((pickedCount / totalItems) * 100) : 0;

  // Unpicked items first, picked items at bottom
  const sortedItems = [...pickList.items].sort((a, b) => {
    if (a.picked === b.picked) return 0;
    return a.picked ? 1 : -1;
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-44 -mx-6 -mt-6">
      {/* Top bar */}
      <div className="sticky top-16 z-10 bg-gray-900 border-b border-gray-700 px-4 py-3 flex items-center gap-3">
        <Link
          href="/warehouse"
          className="text-gray-400 hover:text-white text-2xl leading-none"
          aria-label="Back to warehouse"
        >
          ←
        </Link>
        <div>
          <h1 className="text-base font-semibold text-white leading-tight">
            Pick List — {pickList.order.orderNumber}
          </h1>
          <p className="text-xs text-gray-400">{totalItems} items total</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-white">
            {pickedCount} of {totalItems} items picked
          </span>
          <span className="text-sm font-bold text-green-400">{progressPct}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className="bg-green-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Item cards */}
      <div className="px-4 pt-2 space-y-3">
        {sortedItems.map((item) => {
          const { sku } = item.orderItem;
          const isPicking = loadingItemId === item.id;

          return (
            <div
              key={item.id}
              className={`bg-gray-800 rounded-lg p-4 flex items-start gap-3 transition-opacity ${
                item.picked ? "opacity-50" : "opacity-100"
              }`}
            >
              {/* Left: item details */}
              <div className="flex-1 min-w-0">
                {/* Product name */}
                <p className="text-white font-semibold text-base leading-snug mb-0.5">
                  {sku.name}
                </p>
                {/* SKU code */}
                <p className="text-gray-400 font-mono text-sm mb-1">{sku.skuCode}</p>
                {/* Size + Color */}
                <p className="text-gray-300 text-sm mb-2">
                  {sku.size} · {sku.color}
                </p>
                {/* Quantity */}
                <p className="text-gray-200 text-lg font-bold mb-2">
                  ×{item.orderItem.quantity}
                </p>
                {/* Location — most prominent element */}
                <p className="text-yellow-400 font-bold text-lg">{item.location}</p>
              </div>

              {/* Right: action */}
              <div className="shrink-0 flex items-center">
                {item.picked ? (
                  <div className="flex items-center justify-center w-24 h-12 rounded-lg bg-green-800 text-green-300">
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handlePickItem(item.id)}
                    disabled={isPicking}
                    className="min-h-[48px] min-w-[100px] bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:opacity-60 text-white font-bold text-sm rounded-lg transition-colors px-4 py-3"
                  >
                    {isPicking ? "..." : "PICKED"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom sticky bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4 space-y-2">
        <button
          type="button"
          onClick={handleScanBarcode}
          className="w-full min-h-[48px] border-2 border-gray-500 text-gray-300 hover:border-gray-300 hover:text-white font-semibold text-sm rounded-lg transition-colors"
        >
          SCAN BARCODE
        </button>
        <button
          type="button"
          onClick={handleCompletePick}
          disabled={!allPicked || isCompleting}
          className="w-full min-h-[48px] bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-base rounded-lg transition-colors"
        >
          {isCompleting ? "Completing..." : "COMPLETE PICK"}
        </button>
      </div>
    </div>
  );
}
