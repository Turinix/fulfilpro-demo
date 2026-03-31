"use client";

/**
 * DispatchActions — handles dispatch button interactions for the warehouse hub.
 * mode="single": renders a "Mark Dispatched" button for one shipment → POST /api/warehouse/dispatch/[id]
 * mode="bulk": renders a "Dispatch All" button → POST /api/warehouse/dispatch/bulk
 * Calls router.refresh() on success to reload the server-rendered data.
 * Props: mode, shipmentId (required for mode="single")
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DispatchActionsProps {
  mode: "single" | "bulk";
  shipmentId?: string;
}

export default function DispatchActions({ mode, shipmentId }: DispatchActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleDispatch = async () => {
    setIsLoading(true);
    try {
      const url =
        mode === "bulk"
          ? "/api/warehouse/dispatch/bulk"
          : `/api/warehouse/dispatch/${shipmentId}`;

      const res = await fetch(url, { method: "POST" });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (mode === "bulk") {
    return (
      <button
        type="button"
        onClick={handleDispatch}
        disabled={isLoading}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
      >
        {isLoading ? "Dispatching..." : "Dispatch All"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleDispatch}
      disabled={isLoading}
      className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
    >
      {isLoading ? "..." : "Mark Dispatched"}
    </button>
  );
}
