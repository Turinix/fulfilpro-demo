"use client";

/**
 * StockAdjustModal — modal for adjusting stock of a single inventory item.
 * Shows current stock, an adjustment input (+/-), and a reason dropdown.
 * On submit: POST /api/inventory/[id]/adjust with { adjustment, reason }.
 * On success: closes modal and calls router.refresh() to reload server data.
 * Props: inventoryId, skuCode, productName, currentStock, onClose.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

const REASON_OPTIONS = [
  { value: "Received shipment", label: "Received shipment" },
  { value: "Manual count", label: "Manual count" },
  { value: "Damaged", label: "Damaged" },
  { value: "Other", label: "Other" },
];

interface StockAdjustModalProps {
  inventoryId: string;
  skuCode: string;
  productName: string;
  currentStock: number;
  onClose: () => void;
}

export default function StockAdjustModal({
  inventoryId,
  skuCode,
  productName,
  currentStock,
  onClose,
}: StockAdjustModalProps) {
  const router = useRouter();
  const [adjustment, setAdjustment] = useState<string>("");
  const [reason, setReason] = useState(REASON_OPTIONS[0].value);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const adjustmentNum = parseInt(adjustment, 10) || 0;
  const newStock = currentStock + adjustmentNum;

  const handleSubmit = async () => {
    if (!adjustment || isNaN(parseInt(adjustment, 10))) {
      setError("Please enter a valid adjustment value.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/inventory/${inventoryId}/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adjustment: adjustmentNum, reason }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to update stock.");
        return;
      }

      router.refresh();
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Adjust Stock</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              <span className="font-mono text-xs">{skuCode}</span> — {productName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Current stock display */}
        <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-600">Current Stock</span>
          <span className="text-2xl font-bold text-gray-900">{currentStock}</span>
        </div>

        {/* Adjustment input */}
        <div className="space-y-1.5">
          <label htmlFor="adjustment" className="text-sm font-medium text-gray-700">
            Adjustment (positive to add, negative to remove)
          </label>
          <input
            id="adjustment"
            type="number"
            value={adjustment}
            onChange={(e) => setAdjustment(e.target.value)}
            placeholder="e.g. +10 or -5"
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {adjustment !== "" && (
            <p className="text-xs text-gray-500">
              New stock will be:{" "}
              <span className={`font-semibold ${newStock < 0 ? "text-red-600" : "text-gray-900"}`}>
                {newStock < 0 ? 0 : newStock} units
              </span>
              {newStock < 0 && (
                <span className="text-red-500 ml-1">(stock cannot go below 0)</span>
              )}
            </p>
          )}
        </div>

        {/* Reason dropdown */}
        <div className="space-y-1.5">
          <label htmlFor="reason" className="text-sm font-medium text-gray-700">
            Reason
          </label>
          <select
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {REASON_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Error message */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !adjustment}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Updating..." : "Update Stock"}
          </button>
        </div>
      </div>
    </div>
  );
}
