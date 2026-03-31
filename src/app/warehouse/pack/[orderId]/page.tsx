"use client";

/**
 * Pack Order page — client component.
 * Fetches pick list data for item verification display.
 * User selects package size (Small / Medium / Large), optional weight.
 * "Generate Shipping Label" → POST /api/warehouse/pack/[orderId] → shows AWB + courier details.
 * "Confirm Packed" → POST /api/warehouse/pack/[orderId]/confirm → redirects to /warehouse.
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

interface PickListItemData {
  id: string;
  location: string;
  picked: boolean;
  orderItem: {
    quantity: number;
    sku: SkuData;
  };
}

interface PickListData {
  order: { orderNumber: string };
  items: PickListItemData[];
}

interface ShipmentData {
  id: string;
  courier: string;
  awbNumber: string;
  packageSize: string;
  weight: number | null;
}

const PACKAGE_SIZES = ["small", "medium", "large"] as const;
type PackageSize = (typeof PACKAGE_SIZES)[number];

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default function PackOrderPage({ params }: PageProps) {
  const router = useRouter();
  const [orderId, setOrderId] = useState<string>("");
  const [pickList, setPickList] = useState<PickListData | null>(null);
  const [selectedSize, setSelectedSize] = useState<PackageSize>("medium");
  const [weight, setWeight] = useState<string>("");
  const [shipment, setShipment] = useState<ShipmentData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    params.then(({ orderId: id }) => {
      setOrderId(id);
      fetch(`/api/warehouse/pick/${id}`)
        .then((res) => res.json())
        .then(({ data }) => setPickList(data));
    });
  }, [params]);

  const handleGenerateLabel = async () => {
    if (!orderId) return;
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/warehouse/pack/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageSize: selectedSize,
          weight: weight ? parseFloat(weight) : undefined,
        }),
      });
      if (res.ok) {
        const { data } = await res.json();
        setShipment(data);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmPacked = async () => {
    if (!orderId) return;
    setIsConfirming(true);
    try {
      const res = await fetch(`/api/warehouse/pack/${orderId}/confirm`, { method: "POST" });
      if (res.ok) {
        router.push("/warehouse");
      }
    } finally {
      setIsConfirming(false);
    }
  };

  if (!pickList) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-gray-400">Loading order details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/warehouse" className="text-sm text-gray-500 hover:text-gray-700">
          ← Warehouse
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-semibold text-gray-900">
          Pack Order — {pickList.order.orderNumber}
        </h1>
      </div>

      {/* Items verification list */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Items to Pack</h2>
          <p className="text-xs text-gray-500 mt-0.5">Verify all items before sealing the package</p>
        </div>
        <ul className="divide-y divide-gray-50">
          {pickList.items.map((item) => (
            <li key={item.id} className="px-5 py-3.5 flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{item.orderItem.sku.name}</p>
                <p className="text-xs text-gray-400 font-mono">{item.orderItem.sku.skuCode}</p>
                <p className="text-xs text-gray-500">
                  {item.orderItem.sku.size} · {item.orderItem.sku.color} · ×{item.orderItem.quantity}
                </p>
              </div>
              <p className="text-xs text-gray-400">{item.location}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Package configuration */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 space-y-5">
        <h2 className="text-base font-semibold text-gray-900">Package Details</h2>

        {/* Package size selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Package Size</label>
          <div className="grid grid-cols-3 gap-3">
            {PACKAGE_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(size)}
                className={`py-3 px-4 rounded-lg border-2 font-semibold text-sm capitalize transition-all ${
                  selectedSize === size
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Weight input */}
        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
            Weight (kg) <span className="text-gray-400 font-normal">— optional</span>
          </label>
          <input
            id="weight"
            type="number"
            step="0.1"
            min="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g. 1.2"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Generate label button */}
        {!shipment && (
          <button
            type="button"
            onClick={handleGenerateLabel}
            disabled={isGenerating}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
          >
            {isGenerating ? "Generating Label..." : "Generate Shipping Label"}
          </button>
        )}
      </div>

      {/* Shipment label success card */}
      {shipment && (
        <div className="bg-green-50 border-2 border-green-400 rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <h3 className="text-base font-bold text-green-800">Shipping Label Generated</h3>
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-green-600 font-medium">Courier</dt>
              <dd className="text-green-900 font-bold text-base">{shipment.courier}</dd>
            </div>
            <div>
              <dt className="text-green-600 font-medium">AWB Number</dt>
              <dd className="text-green-900 font-bold text-base font-mono">{shipment.awbNumber}</dd>
            </div>
            <div>
              <dt className="text-green-600 font-medium">Package Size</dt>
              <dd className="text-green-900 capitalize">{shipment.packageSize}</dd>
            </div>
            {shipment.weight && (
              <div>
                <dt className="text-green-600 font-medium">Weight</dt>
                <dd className="text-green-900">{Number(shipment.weight).toFixed(1)} kg</dd>
              </div>
            )}
          </dl>

          {/* Simulated barcode visual */}
          <div className="bg-white rounded border border-green-200 px-4 py-3 text-center">
            <p className="text-xs text-gray-400 mb-1">Barcode</p>
            <div className="flex items-end justify-center gap-0.5 h-10">
              {Array.from({ length: 40 }, (_, i) => (
                <div
                  key={i}
                  className="bg-gray-900 rounded-sm"
                  style={{
                    width: i % 3 === 0 ? "3px" : "1.5px",
                    height: `${60 + (i % 5) * 8}%`,
                  }}
                />
              ))}
            </div>
            <p className="text-xs font-mono text-gray-600 mt-1">{shipment.awbNumber}</p>
          </div>

          <button
            type="button"
            onClick={handleConfirmPacked}
            disabled={isConfirming}
            className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold rounded-lg transition-colors"
          >
            {isConfirming ? "Confirming..." : "Confirm Packed →"}
          </button>
        </div>
      )}
    </div>
  );
}
