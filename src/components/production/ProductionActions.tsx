"use client";

/**
 * ProductionActions — per-row action buttons on the Production Queue page.
 * "Start Production" for queued jobs → POST /api/production/[id]/start.
 * "Mark Ready" for in_production jobs → POST /api/production/[id]/complete.
 * Calls router.refresh() after success to reload server data.
 * Props: jobId, status.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProductionActionsProps {
  jobId: string;
  status: string;
}

export default function ProductionActions({ jobId, status }: ProductionActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const callApi = async (endpoint: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/production/${jobId}/${endpoint}`, { method: "POST" });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "queued") {
    return (
      <button
        type="button"
        onClick={() => callApi("start")}
        disabled={isLoading}
        className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
      >
        {isLoading ? "..." : "Start Production"}
      </button>
    );
  }

  if (status === "in_production") {
    return (
      <button
        type="button"
        onClick={() => callApi("complete")}
        disabled={isLoading}
        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
      >
        {isLoading ? "..." : "Mark Ready"}
      </button>
    );
  }

  return (
    <span className="text-xs text-gray-400">—</span>
  );
}
