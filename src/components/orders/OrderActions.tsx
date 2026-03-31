"use client";

/**
 * OrderActions — action buttons for the order detail page.
 * Shows "Approve Route" (primary blue) and "Hold Order" (red outline) conditionally.
 * POSTs to /api/orders/[id]/approve then calls router.refresh() to update server data.
 * Props: orderId, status, routingDecision.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

interface OrderActionsProps {
  orderId: string;
  status: string;
  routingDecision: string | null;
}

export default function OrderActions({ orderId, status, routingDecision }: OrderActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const canApprove = status === "new" || (status === "routed" && routingDecision === null);

  const handleApprove = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/approve`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: "Route approved successfully", isError: false });
        router.refresh();
      } else {
        setMessage({ text: data.error ?? "Failed to approve route", isError: true });
      }
    } catch {
      setMessage({ text: "Network error", isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  const handleHold = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hold: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: "Order placed on hold", isError: false });
        router.refresh();
      } else {
        setMessage({ text: data.error ?? "Failed to hold order", isError: true });
      }
    } catch {
      setMessage({ text: "Network error", isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  if (!canApprove) return null;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {message && (
        <span
          className={`text-sm font-medium ${message.isError ? "text-red-600" : "text-green-600"}`}
        >
          {message.text}
        </span>
      )}
      <button
        type="button"
        onClick={handleApprove}
        disabled={isLoading}
        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {isLoading ? "Processing..." : "Approve Route"}
      </button>
      <button
        type="button"
        onClick={handleHold}
        disabled={isLoading}
        className="px-5 py-2.5 border-2 border-red-500 text-red-500 hover:bg-red-50 disabled:opacity-50 text-sm font-medium rounded-lg transition-colors"
      >
        Hold Order
      </button>
    </div>
  );
}
