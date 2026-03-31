"use client";

/**
 * OrderFilters — client component for filtering orders by status and paginating.
 * Reads/writes URL search params so the server component re-fetches on change.
 * Props: currentStatus, currentPage (from URL params).
 */

import { useRouter, useSearchParams } from "next/navigation";

const STATUS_OPTIONS = [
  { value: "", label: "All Orders" },
  { value: "new", label: "New" },
  { value: "routed", label: "Routed" },
  { value: "picking", label: "Picking" },
  { value: "packing", label: "Packing" },
  { value: "dispatched", label: "Dispatched" },
  { value: "shipped", label: "Shipped" },
];

interface OrderFiltersProps {
  currentStatus: string;
  currentPage: number;
  totalCount: number;
  pageSize: number;
}

export default function OrderFilters({
  currentStatus,
  currentPage,
  totalCount,
  pageSize,
}: OrderFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const totalPages = Math.ceil(totalCount / pageSize);
  const from = currentPage * pageSize + 1;
  const to = Math.min((currentPage + 1) * pageSize, totalCount);

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    router.push(`/orders?${params.toString()}`);
  };

  const handleStatusChange = (value: string) => {
    updateParams({ status: value, page: "0" });
  };

  const handlePrev = () => {
    updateParams({ page: String(currentPage - 1) });
  };

  const handleNext = () => {
    updateParams({ page: String(currentPage + 1) });
  };

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      {/* Status filter */}
      <div className="flex items-center gap-2">
        <label htmlFor="status-filter" className="text-sm text-gray-600 whitespace-nowrap">
          Filter by status:
        </label>
        <select
          id="status-filter"
          value={currentStatus}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {from}–{to} of {totalCount}
          </span>
          <div className="flex gap-1">
            <button
              onClick={handlePrev}
              disabled={currentPage === 0}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Prev
            </button>
            <button
              onClick={handleNext}
              disabled={currentPage >= totalPages - 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
