"use client";

/**
 * AdjustButton — per-row button that opens the StockAdjustModal.
 * Manages modal open state locally. Passes inventory data to the modal.
 * Props: inventoryId, skuCode, productName, currentStock.
 */

import { useState } from "react";
import StockAdjustModal from "./StockAdjustModal";

interface AdjustButtonProps {
  inventoryId: string;
  skuCode: string;
  productName: string;
  currentStock: number;
}

export default function AdjustButton({
  inventoryId,
  skuCode,
  productName,
  currentStock,
}: AdjustButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-2.5 py-1 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap"
      >
        Adjust
      </button>

      {isOpen && (
        <StockAdjustModal
          inventoryId={inventoryId}
          skuCode={skuCode}
          productName={productName}
          currentStock={currentStock}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
