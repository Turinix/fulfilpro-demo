"use client";

/**
 * InventoryFilters — client component for filtering inventory.
 * Reads/writes URL search params so the server component re-fetches on change.
 * Supports: search (name/SKU), category dropdown, stock level dropdown, pagination.
 * Props: currentSearch, currentCategory, currentStockLevel, currentPage, totalCount, pageSize.
 */

import { useRouter, useSearchParams } from "next/navigation";

const CATEGORY_OPTIONS = [
  { value: "", label: "All Categories" },
  { value: "Tops", label: "Tops" },
  { value: "Bottoms", label: "Bottoms" },
  { value: "Outerwear", label: "Outerwear" },
  { value: "Accessories", label: "Accessories" },
];

const STOCK_LEVEL_OPTIONS = [
  { value: "", label: "All Stock Levels" },
  { value: "in_stock", label: "In Stock" },
  { value: "low", label: "Low Stock" },
  { value: "out_of_stock", label: "Out of Stock" },
];

interface InventoryFiltersProps {
  currentSearch: string;
  currentCategory: string;
  currentStockLevel: string;
  currentPage: number;
  totalCount: number;
  pageSize: number;
}

export default function InventoryFilters({
  currentSearch,
  currentCategory,
  currentStockLevel,
  currentPage,
  totalCount,
  pageSize,
}: InventoryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const totalPages = Math.ceil(totalCount / pageSize);
  const from = totalCount === 0 ? 0 : currentPage * pageSize + 1;
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
    router.push(`/inventory?${params.toString()}`);
  };

  const handleSearch = (value: string) => {
    updateParams({ search: value, page: "0" });
  };

  const handleCategory = (value: string) => {
    updateParams({ category: value, page: "0" });
  };

  const handleStockLevel = (value: string) => {
    updateParams({ stockLevel: value, page: "0" });
  };

  const handlePrev = () => {
    updateParams({ page: String(currentPage - 1) });
  };

  const handleNext = () => {
    updateParams({ page: String(currentPage + 1) });
  };

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      {/* Left: filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search input */}
        <input
          type="text"
          placeholder="Search by name or SKU..."
          defaultValue={currentSearch}
          onBlur={(e) => {
            if (e.target.value !== currentSearch) handleSearch(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch((e.target as HTMLInputElement).value);
          }}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
        />

        {/* Category filter */}
        <select
          value={currentCategory}
          onChange={(e) => handleCategory(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Stock level filter */}
        <select
          value={currentStockLevel}
          onChange={(e) => handleStockLevel(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STOCK_LEVEL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Right: pagination */}
      {totalCount > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {from}–{to} of {totalCount}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentPage === 0}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Prev
            </button>
            <button
              type="button"
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
