/**
 * StatusChip — universal status badge used across all pages.
 * Maps a status string to a Tailwind color pair and renders a pill badge.
 * Capitalizes the status and replaces underscores with spaces.
 */

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  routed: "bg-purple-100 text-purple-800",
  picking: "bg-yellow-100 text-yellow-800",
  packing: "bg-orange-100 text-orange-800",
  dispatched: "bg-indigo-100 text-indigo-800",
  shipped: "bg-green-100 text-green-800",
  delivered: "bg-green-100 text-green-800",
  return_requested: "bg-red-100 text-red-800",
  return_approved: "bg-red-100 text-red-800",
  return_received: "bg-amber-100 text-amber-800",
  refunded: "bg-gray-100 text-gray-800",
  queued: "bg-gray-100 text-gray-800",
  in_production: "bg-orange-100 text-orange-800",
  ready: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  low: "bg-yellow-100 text-yellow-800",
  out_of_stock: "bg-red-100 text-red-800",
  in_stock: "bg-green-100 text-green-800",
  requested: "bg-blue-100 text-blue-800",
  approved: "bg-purple-100 text-purple-800",
  received: "bg-amber-100 text-amber-800",
  rejected: "bg-red-100 text-red-800",
  packed: "bg-indigo-100 text-indigo-800",
};

interface StatusChipProps {
  status: string;
}

export default function StatusChip({ status }: StatusChipProps) {
  const colorClass = STATUS_COLORS[status] ?? "bg-gray-100 text-gray-800";
  const label = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
}
