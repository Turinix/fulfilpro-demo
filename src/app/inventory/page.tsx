/**
 * Inventory Management page — server component.
 * Fetches all inventory rows from Prisma (with SKU joined), applies JS-side filtering
 * for search, category, and stock level (POC: 50 SKUs max), then paginates.
 * Shows a yellow warning banner when any SKUs are below their reorder point.
 * Renders filter bar (client) and per-row AdjustButton (client) inside Suspense.
 */

import { prisma } from "@/lib/prisma";
import StatusChip from "@/components/StatusChip";
import InventoryFilters from "@/components/inventory/InventoryFilters";
import AdjustButton from "@/components/inventory/AdjustButton";
import { Suspense } from "react";

const PAGE_SIZE = 25;

/** Maps hex/name color strings to a small colored dot */
const COLOR_DOTS: Record<string, string> = {
  black: "bg-gray-900",
  navy: "bg-blue-900",
  grey: "bg-gray-400",
  gray: "bg-gray-400",
  white: "bg-white border border-gray-300",
  red: "bg-red-500",
  blue: "bg-blue-500",
  green: "bg-green-600",
  "heather grey": "bg-gray-400",
  "heather gray": "bg-gray-400",
  olive: "bg-yellow-700",
  khaki: "bg-yellow-200",
  brown: "bg-amber-800",
  camel: "bg-amber-400",
  charcoal: "bg-gray-700",
  tan: "bg-amber-300",
  "off-white": "bg-stone-100 border border-gray-200",
};

function getColorDot(color: string): string {
  return COLOR_DOTS[color.toLowerCase()] ?? "bg-gray-300";
}

/** Derive inventory status string from inStock vs reorderPoint */
function getStockStatus(inStock: number, reorderPoint: number): string {
  if (inStock === 0) return "out_of_stock";
  if (inStock < reorderPoint) return "low";
  return "in_stock";
}

interface PageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    stockLevel?: string;
    page?: string;
  }>;
}

export default async function InventoryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.search ?? "";
  const category = params.category ?? "";
  const stockLevel = params.stockLevel ?? "";
  const page = Math.max(0, parseInt(params.page ?? "0", 10) || 0);

  // Fetch all inventory with SKU (50 rows — safe to JS-filter for POC)
  const allInventory = await prisma.inventory.findMany({
    include: { sku: true },
    orderBy: { sku: { name: "asc" } },
  });

  // Count SKUs below reorder point for the warning banner (always from full dataset)
  const belowReorderCount = allInventory.filter(
    (inv) => inv.inStock < inv.reorderPoint
  ).length;

  // Apply filters in JS
  const filtered = allInventory.filter((inv) => {
    const matchesSearch =
      !search ||
      inv.sku.name.toLowerCase().includes(search.toLowerCase()) ||
      inv.sku.skuCode.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = !category || inv.sku.category === category;

    const status = getStockStatus(inv.inStock, inv.reorderPoint);
    const matchesStockLevel = !stockLevel || status === stockLevel;

    return matchesSearch && matchesCategory && matchesStockLevel;
  });

  const totalCount = filtered.length;
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-5">
      {/* Warning banner — only visible when SKUs are below reorder point */}
      {belowReorderCount > 0 && (
        <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
          <svg
            className="w-5 h-5 text-yellow-600 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-sm font-medium text-yellow-800">
            {belowReorderCount} SKU{belowReorderCount !== 1 ? "s" : ""} below reorder point — Review stock levels
          </p>
        </div>
      )}

      {/* Page heading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Inventory Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalCount.toLocaleString("en-IN")} SKUs
          </p>
        </div>
        <p className="text-sm text-gray-400 hidden sm:block">
          Use the &ldquo;Adjust&rdquo; button on each row to update stock quantities
        </p>
      </div>

      {/* Filter bar — client component with Suspense boundary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 px-5 py-3">
        <Suspense fallback={<div className="h-8" />}>
          <InventoryFilters
            currentSearch={search}
            currentCategory={category}
            currentStockLevel={stockLevel}
            currentPage={page}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
          />
        </Suspense>
      </div>

      {/* Inventory table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                SKU Code
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Product Name
              </th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Size
              </th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Color
              </th>
              <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                In Stock
              </th>
              <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Reserved
              </th>
              <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Available
              </th>
              <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Reorder Pt.
              </th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Location
              </th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Status
              </th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginated.map((inv) => {
              const available = inv.inStock - inv.reserved;
              const isBelowReorder = inv.inStock < inv.reorderPoint;
              const status = getStockStatus(inv.inStock, inv.reorderPoint);
              const location = `${inv.aisle}-${inv.shelf}-${inv.bin}`;
              const dotClass = getColorDot(inv.sku.color);

              return (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  {/* SKU Code — monospace */}
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-xs text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                      {inv.sku.skuCode}
                    </span>
                  </td>

                  {/* Product Name */}
                  <td className="px-4 py-3.5 text-gray-800 font-medium max-w-[200px]">
                    <span className="line-clamp-2 leading-snug">{inv.sku.name}</span>
                  </td>

                  {/* Size */}
                  <td className="px-3 py-3.5 text-gray-600">{inv.sku.size}</td>

                  {/* Color — dot + label */}
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-block w-3 h-3 rounded-full flex-shrink-0 ${dotClass}`} />
                      <span className="text-gray-600">{inv.sku.color}</span>
                    </div>
                  </td>

                  {/* In Stock — red if below reorder point */}
                  <td className={`px-3 py-3.5 text-right font-semibold ${isBelowReorder ? "text-red-600" : "text-gray-900"}`}>
                    {inv.inStock}
                  </td>

                  {/* Reserved */}
                  <td className="px-3 py-3.5 text-right text-gray-500">{inv.reserved}</td>

                  {/* Available (computed) */}
                  <td className="px-3 py-3.5 text-right font-medium text-gray-700">
                    {Math.max(0, available)}
                  </td>

                  {/* Reorder Point */}
                  <td className="px-3 py-3.5 text-right text-gray-500">{inv.reorderPoint}</td>

                  {/* Location */}
                  <td className="px-3 py-3.5">
                    <span className="font-mono text-xs text-gray-600">{location}</span>
                  </td>

                  {/* Status chip */}
                  <td className="px-3 py-3.5">
                    <StatusChip status={status} />
                  </td>

                  {/* Adjust button */}
                  <td className="px-3 py-3.5">
                    <Suspense fallback={<div className="w-14 h-6" />}>
                      <AdjustButton
                        inventoryId={inv.id}
                        skuCode={inv.sku.skuCode}
                        productName={inv.sku.name}
                        currentStock={inv.inStock}
                      />
                    </Suspense>
                  </td>
                </tr>
              );
            })}

            {paginated.length === 0 && (
              <tr>
                <td colSpan={11} className="px-5 py-10 text-center text-gray-400 text-sm">
                  No inventory items match your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
