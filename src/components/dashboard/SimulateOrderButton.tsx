"use client";

/**
 * SimulateOrderButton — POSTs to /api/orders/simulate then refreshes the server component data.
 * Uses router.refresh() to re-fetch server component data without a full page reload.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SimulateOrderButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const handleSimulate = async () => {
    setIsLoading(true);
    setLastResult(null);
    try {
      const res = await fetch("/api/orders/simulate", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setLastResult(`Created ${data.orderNumber}`);
        router.refresh();
      } else {
        setLastResult("Error creating order");
      }
    } catch {
      setLastResult("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {lastResult && (
        <span className="text-sm text-green-600 font-medium">{lastResult}</span>
      )}
      <button
        type="button"
        onClick={handleSimulate}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        {isLoading ? "Creating..." : "Simulate New Order"}
      </button>
    </div>
  );
}
