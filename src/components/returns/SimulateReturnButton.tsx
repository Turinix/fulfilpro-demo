"use client";

/**
 * SimulateReturnButton — triggers POST /api/returns/simulate then refreshes the page.
 * Displays a loading state while the request is in flight.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SimulateReturnButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSimulate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/returns/simulate", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        router.refresh();
      } else {
        setError(data.error ?? "Failed to simulate return");
      }
    } catch {
      setError("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {error && <span className="text-sm text-red-600">{error}</span>}
      <button
        type="button"
        onClick={handleSimulate}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {isLoading ? "Simulating..." : "Simulate Return"}
      </button>
    </div>
  );
}
