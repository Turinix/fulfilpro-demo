"use client";

/**
 * ExecuteButton — client component that shows a simulated "Action queued" alert on click.
 * Used in the Recommended Actions table per row.
 * Props: skuCode — shown in the alert message for clarity.
 */

interface ExecuteButtonProps {
  skuCode: string;
}

export default function ExecuteButton({ skuCode }: ExecuteButtonProps) {
  const handleClick = () => {
    alert(`Action queued for review — ${skuCode}`);
  };

  return (
    <button
      onClick={handleClick}
      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors"
    >
      Execute
    </button>
  );
}
