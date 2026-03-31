/**
 * Demand Intelligence — server component.
 * Queries DemandForecast + SKU + Inventory from Prisma to power 3 sections:
 *   1. Insight Cards: trending up SKUs, seasonal alert (hardcoded), slow movers.
 *   2. Forecast Chart: 60-day aggregate (all SKUs) actual vs predicted with confidence band.
 *   3. Recommended Actions table: per-SKU stock gap, action logic, confidence, execute button.
 * Chart and Execute buttons are extracted as 'use client' components.
 */

import { prisma } from "@/lib/prisma";
import StatusChip from "@/components/StatusChip";
import ForecastChart, { type ChartPoint } from "@/components/intelligence/ForecastChart";
import ExecuteButton from "@/components/intelligence/ExecuteButton";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a Date to "DD MMM" for chart axis labels */
function fmtAxisDate(d: Date): string {
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

/** Format a Date to ISO date string "YYYY-MM-DD" for keying */
function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Truncate time portion so dates are compared by day only */
function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

/** Add N days to a date */
function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

/** Derive the confidence chip status key for StatusChip */
function confidenceStatus(conf: string): string {
  if (conf === "high") return "in_stock";    // green
  if (conf === "medium") return "picking";   // yellow
  return "return_requested";                 // red (low)
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function IntelligencePage() {
  const now = startOfDay(new Date());
  const past7 = addDays(now, -7);
  const future7 = addDays(now, 7);
  const past30 = addDays(now, -30);
  const future30 = addDays(now, 30);

  // -------------------------------------------------------------------------
  // Query 1: Insight cards — 7-day window either side of today
  // -------------------------------------------------------------------------
  const insightForecasts = await prisma.demandForecast.findMany({
    include: { sku: true },
    where: { date: { gte: past7, lte: future7 } },
  });

  // Group by SKU id
  const bySkuInsight: Record<
    string,
    {
      skuId: string;
      skuCode: string;
      skuName: string;
      pastActuals: number[];
      futurePredicted: number[];
    }
  > = {};

  for (const row of insightForecasts) {
    if (!bySkuInsight[row.skuId]) {
      bySkuInsight[row.skuId] = {
        skuId: row.skuId,
        skuCode: row.sku.skuCode,
        skuName: row.sku.name,
        pastActuals: [],
        futurePredicted: [],
      };
    }
    const entry = bySkuInsight[row.skuId];
    const rowDay = startOfDay(row.date);
    if (rowDay < now && row.actualUnits !== null) {
      entry.pastActuals.push(row.actualUnits);
    } else if (rowDay >= now) {
      entry.futurePredicted.push(row.predictedUnits);
    }
  }

  // Compute growth rate per SKU: (avg future predicted) / (avg past actual) - 1
  const skuGrowth = Object.values(bySkuInsight)
    .map((s) => {
      const avgPast =
        s.pastActuals.length > 0
          ? s.pastActuals.reduce((a, b) => a + b, 0) / s.pastActuals.length
          : 0;
      const avgFuture =
        s.futurePredicted.length > 0
          ? s.futurePredicted.reduce((a, b) => a + b, 0) / s.futurePredicted.length
          : 0;
      const growthRate = avgPast > 0 ? (avgFuture / avgPast - 1) : 0;
      return { ...s, avgPast, avgFuture, growthRate };
    })
    .sort((a, b) => b.growthRate - a.growthRate);

  const trendingUp = skuGrowth.slice(0, 3);
  const slowMovers = skuGrowth.slice(-3).reverse();

  // Fetch inventory for insight SKUs
  const insightSkuIds = [
    ...trendingUp.map((s) => s.skuId),
    ...slowMovers.map((s) => s.skuId),
  ];
  const insightInventory = await prisma.inventory.findMany({
    where: { skuId: { in: insightSkuIds } },
    select: { skuId: true, inStock: true },
  });
  const inventoryBySkuId = Object.fromEntries(
    insightInventory.map((inv) => [inv.skuId, inv.inStock])
  );

  // -------------------------------------------------------------------------
  // Query 2: Chart data — 60-day window
  // -------------------------------------------------------------------------
  const chartForecasts = await prisma.demandForecast.findMany({
    where: { date: { gte: past30, lte: future30 } },
    orderBy: { date: "asc" },
    select: { date: true, predictedUnits: true, actualUnits: true },
  });

  // Aggregate by date key: sum predictedUnits and actualUnits across all SKUs
  const aggregatedByDate: Record<string, { predicted: number; actual: number; hasActual: boolean }> = {};
  for (const row of chartForecasts) {
    const key = toDateKey(row.date);
    if (!aggregatedByDate[key]) {
      aggregatedByDate[key] = { predicted: 0, actual: 0, hasActual: false };
    }
    aggregatedByDate[key].predicted += row.predictedUnits;
    if (row.actualUnits !== null) {
      aggregatedByDate[key].actual += row.actualUnits;
      aggregatedByDate[key].hasActual = true;
    }
  }

  const todayKey = toDateKey(now);
  const todayLabel = fmtAxisDate(now);

  // Build chart points in date order
  const chartPoints: ChartPoint[] = Object.entries(aggregatedByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, agg]) => {
      const d = new Date(key + "T00:00:00Z");
      const dateLabel = fmtAxisDate(d);
      const isPastOrToday = key <= todayKey;
      return {
        date: key,
        dateLabel,
        actual: isPastOrToday && agg.hasActual ? agg.actual : null,
        predicted: agg.predicted,
        bandHigh: Math.round(agg.predicted * 1.15),
        bandLow: Math.round(agg.predicted * 0.85),
        isToday: key === todayKey,
      };
    });

  // -------------------------------------------------------------------------
  // Query 3: Recommended actions — all SKUs with next-7-day forecasts + inventory
  // -------------------------------------------------------------------------
  const skusWithData = await prisma.sKU.findMany({
    include: {
      inventory: true,
      forecasts: {
        where: { date: { gte: now, lte: future7 } },
        select: { predictedUnits: true, confidence: true },
      },
    },
  });

  type ActionType = "Pre-produce" | "Restock" | "Markdown" | "Hold";

  interface RecommendedRow {
    skuId: string;
    skuCode: string;
    skuName: string;
    currentStock: number;
    predictedDemand: number;
    gap: number;
    action: ActionType;
    confidence: string;
    growthRate: number;
  }

  // Lookup growth rates computed from insight query
  const growthRateById: Record<string, number> = {};
  for (const s of skuGrowth) {
    growthRateById[s.skuId] = s.growthRate;
  }

  const recommendedRows: RecommendedRow[] = skusWithData
    .map((sku) => {
      const currentStock = sku.inventory?.inStock ?? 0;
      const predictedDemand = sku.forecasts.reduce((sum, f) => sum + f.predictedUnits, 0);
      const gap = currentStock - predictedDemand;
      const growthRate = growthRateById[sku.id] ?? 0;

      // Determine most common confidence level
      const confCounts: Record<string, number> = {};
      for (const f of sku.forecasts) {
        confCounts[f.confidence] = (confCounts[f.confidence] ?? 0) + 1;
      }
      const confidence =
        Object.entries(confCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "medium";

      // Action logic
      let action: ActionType = "Hold";
      if (currentStock < predictedDemand * 0.5) {
        action = "Pre-produce";
      } else if (currentStock < predictedDemand) {
        action = "Restock";
      } else if (growthRate < 0 && currentStock > predictedDemand * 3) {
        action = "Markdown";
      }

      return {
        skuId: sku.id,
        skuCode: sku.skuCode,
        skuName: sku.name,
        currentStock,
        predictedDemand,
        gap,
        action,
        confidence,
        growthRate,
      };
    })
    .sort((a, b) => a.gap - b.gap)
    .slice(0, 15);

  // -------------------------------------------------------------------------
  // Action chip mapping
  // -------------------------------------------------------------------------
  const ACTION_CHIP: Record<ActionType, { label: string; cls: string }> = {
    "Pre-produce": { label: "Pre-produce", cls: "bg-red-100 text-red-800" },
    Restock: { label: "Restock", cls: "bg-orange-100 text-orange-800" },
    Markdown: { label: "Markdown", cls: "bg-gray-100 text-gray-700" },
    Hold: { label: "Hold", cls: "bg-green-100 text-green-800" },
  };

  // Date range display
  const dateRangeLabel = `${fmtAxisDate(past30)} → ${fmtAxisDate(future30)}`;

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Demand Intelligence</h1>
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
            {dateRangeLabel}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3.5 py-2">
          <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="text-xs font-medium text-blue-700">AI-Powered Forecasting</span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section 1: Insight Cards                                             */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Trending Up */}
        <div className="bg-white rounded-lg shadow-sm border-l-4 border-l-green-500 border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <h2 className="text-sm font-semibold text-gray-900">Trending Up</h2>
          </div>
          <div className="space-y-3">
            {trendingUp.map((sku) => {
              const stock = inventoryBySkuId[sku.skuId] ?? 0;
              const pct = Math.round(sku.growthRate * 100);
              return (
                <div key={sku.skuId} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{sku.skuName}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{sku.skuCode}</p>
                    <p className="text-xs text-gray-500 mt-1">Stock: {stock} units — Pre-produce recommended</p>
                  </div>
                  <span className="flex-shrink-0 text-sm font-bold text-green-600">+{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Seasonal Alert */}
        <div className="bg-white rounded-lg shadow-sm border-l-4 border-l-orange-500 border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-sm font-semibold text-gray-900">Seasonal Alert</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0 mt-1.5" />
              <p className="text-sm text-gray-700 leading-relaxed">
                Summer collection demand expected to spike in <strong>2 weeks</strong> based on last year&apos;s pattern.
                Consider pre-producing lightweight tees and shorts.
              </p>
            </div>
            <div className="mt-3 bg-orange-50 rounded-md px-3 py-2.5">
              <p className="text-xs font-semibold text-orange-800 mb-1">Suggested SKUs</p>
              <ul className="text-xs text-orange-700 space-y-0.5">
                <li>Lightweight Linen Shirt — increase buffer by 30%</li>
                <li>Cargo Shorts — run pre-production batch</li>
                <li>Graphic Tee — front-load orders now</li>
              </ul>
            </div>
            <p className="text-xs text-gray-400 italic">Simulated seasonal signal — last year patterns applied</p>
          </div>
        </div>

        {/* Slow Movers */}
        <div className="bg-white rounded-lg shadow-sm border-l-4 border-l-gray-400 border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
            <h2 className="text-sm font-semibold text-gray-900">Slow Movers</h2>
          </div>
          <div className="space-y-3">
            {slowMovers.map((sku) => {
              const stock = inventoryBySkuId[sku.skuId] ?? 0;
              const pct = Math.round(Math.abs(sku.growthRate) * 100);
              return (
                <div key={sku.skuId} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{sku.skuName}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{sku.skuCode}</p>
                    <p className="text-xs text-gray-500 mt-1">Stock: {stock} units — Consider markdown</p>
                  </div>
                  <span className="flex-shrink-0 text-sm font-bold text-gray-500">-{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section 2: Demand Forecast Chart                                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-gray-900">Demand Forecast — All SKUs</h2>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-5 h-0.5 bg-blue-800" />
              Actual
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-5 h-px border-t-2 border-dashed border-blue-400" />
              Predicted
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-5 h-2.5 bg-blue-100 rounded-sm" />
              ±15% band
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mb-5">
          Aggregated units across all 50 SKUs · {past30.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} to {future30.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
        </p>
        <ForecastChart chartPoints={chartPoints} todayLabel={todayLabel} />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section 3: Recommended Actions Table                                 */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Recommended Actions</h2>
            <p className="text-xs text-gray-400 mt-0.5">Sorted by urgency (largest stock gap first) · Top 15 SKUs</p>
          </div>
          <span className="text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
            Next 7 days
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">SKU Code</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product Name</th>
                <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Current Stock</th>
                <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">7-Day Demand</th>
                <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Gap</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Confidence</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recommendedRows.map((row) => {
                const chip = ACTION_CHIP[row.action];
                const isNegativeGap = row.gap < 0;
                return (
                  <tr key={row.skuId} className="hover:bg-gray-50 transition-colors">
                    {/* SKU Code */}
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                        {row.skuCode}
                      </span>
                    </td>

                    {/* Product Name */}
                    <td className="px-4 py-3.5 font-medium text-gray-800 max-w-[200px]">
                      <span className="line-clamp-1">{row.skuName}</span>
                    </td>

                    {/* Current Stock */}
                    <td className="px-3 py-3.5 text-right text-gray-700 font-medium">
                      {row.currentStock.toLocaleString()}
                    </td>

                    {/* Predicted Demand */}
                    <td className="px-3 py-3.5 text-right text-gray-700">
                      {row.predictedDemand.toLocaleString()}
                    </td>

                    {/* Gap — red if negative */}
                    <td className={`px-3 py-3.5 text-right font-semibold ${isNegativeGap ? "text-red-600" : "text-green-600"}`}>
                      {isNegativeGap ? "" : "+"}{row.gap.toLocaleString()}
                    </td>

                    {/* Action chip */}
                    <td className="px-3 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${chip.cls}`}>
                        {chip.label}
                      </span>
                    </td>

                    {/* Confidence — reuse StatusChip with mapped keys */}
                    <td className="px-3 py-3.5">
                      <StatusChip status={confidenceStatus(row.confidence)} />
                    </td>

                    {/* Execute button */}
                    <td className="px-3 py-3.5">
                      <ExecuteButton skuCode={row.skuCode} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
