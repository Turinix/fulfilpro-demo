"use client";

/**
 * ReturnActions — client component for return detail action buttons.
 * Shows different controls based on current return status:
 *   - requested: "Approve Return" button
 *   - approved: inline form with condition dropdown + "Confirm Receipt"
 *   - received: "Process Refund" button
 * Each action POSTs to the relevant API route then calls router.refresh().
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ReturnActionsProps {
  returnId: string;
  status: string;
}

export default function ReturnActions({ returnId, status }: ReturnActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [condition, setCondition] = useState("good");

  const postAction = async (endpoint: string, body?: Record<string, string>) => {
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/returns/${returnId}/${endpoint}`, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (res.ok) {
        router.refresh();
      } else {
        setMessage({ text: data.error ?? "Action failed", isError: true });
      }
    } catch {
      setMessage({ text: "Network error", isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "requested") {
    return (
      <div className="flex items-center gap-3">
        {message && (
          <span className={`text-sm font-medium ${message.isError ? "text-red-600" : "text-green-600"}`}>
            {message.text}
          </span>
        )}
        <button
          type="button"
          onClick={() => postAction("approve")}
          disabled={isLoading}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {isLoading ? "Processing..." : "Approve Return"}
        </button>
      </div>
    );
  }

  if (status === "approved") {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        {message && (
          <span className={`text-sm font-medium ${message.isError ? "text-red-600" : "text-green-600"}`}>
            {message.text}
          </span>
        )}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700" htmlFor="condition-select">
            Item Condition
          </label>
          <select
            id="condition-select"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="good">Good</option>
            <option value="damaged">Damaged</option>
            <option value="defective">Defective</option>
          </select>
          <button
            type="button"
            onClick={() => postAction("receive", { itemCondition: condition })}
            disabled={isLoading}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {isLoading ? "Processing..." : "Confirm Receipt"}
          </button>
        </div>
      </div>
    );
  }

  if (status === "received") {
    return (
      <div className="flex items-center gap-3">
        {message && (
          <span className={`text-sm font-medium ${message.isError ? "text-red-600" : "text-green-600"}`}>
            {message.text}
          </span>
        )}
        <button
          type="button"
          onClick={() => postAction("refund")}
          disabled={isLoading}
          className="px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {isLoading ? "Processing..." : "Process Refund"}
        </button>
      </div>
    );
  }

  return null;
}
