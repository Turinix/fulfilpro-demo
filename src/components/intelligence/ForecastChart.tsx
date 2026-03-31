"use client";

/**
 * ForecastChart — Recharts line chart for demand forecasting.
 * Renders actual units (solid blue), predicted units (dashed blue), and a confidence band (light blue area).
 * A vertical dashed line marks "today". X axis shows dates, Y axis shows unit counts.
 * Props: chartPoints — array of aggregated { date, actual, predicted, bandHigh, bandLow } objects.
 */

import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from "recharts";

export interface ChartPoint {
  date: string;
  dateLabel: string;
  actual: number | null;
  predicted: number;
  bandHigh: number;
  bandLow: number;
  isToday: boolean;
}

interface ForecastChartProps {
  chartPoints: ChartPoint[];
  todayLabel: string;
}

interface TooltipPayloadEntry {
  name: string;
  value: number | null;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  label?: string;
  payload?: TooltipPayloadEntry[];
}

function CustomTooltip({ active, label, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const actual = payload.find((p) => p.name === "Actual");
  const predicted = payload.find((p) => p.name === "Predicted");

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1.5">{label}</p>
      {actual && actual.value !== null && (
        <p className="text-blue-700">
          <span className="font-medium">Actual:</span> {actual.value.toLocaleString()} units
        </p>
      )}
      {predicted && (
        <p className="text-blue-400">
          <span className="font-medium">Predicted:</span> {predicted.value?.toLocaleString()} units
        </p>
      )}
    </div>
  );
}

export default function ForecastChart({ chartPoints, todayLabel }: ForecastChartProps) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={chartPoints} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />

        <XAxis
          dataKey="dateLabel"
          tick={{ fontSize: 11, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
          interval={6}
        />

        <YAxis
          tick={{ fontSize: 11, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => v.toLocaleString()}
          width={60}
        />

        <Tooltip content={<CustomTooltip />} />

        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
          formatter={(value) => <span className="text-gray-600">{value}</span>}
        />

        {/* Confidence band area between bandLow and bandHigh */}
        <Area
          type="monotone"
          dataKey="bandHigh"
          stroke="none"
          fill="#bfdbfe"
          fillOpacity={0.5}
          legendType="none"
          name="Band High"
          connectNulls
        />
        <Area
          type="monotone"
          dataKey="bandLow"
          stroke="none"
          fill="#f9fafb"
          fillOpacity={1}
          legendType="none"
          name="Band Low"
          connectNulls
        />

        {/* Predicted — dashed blue */}
        <Line
          type="monotone"
          dataKey="predicted"
          stroke="#3b82f6"
          strokeWidth={2}
          strokeDasharray="5 4"
          dot={false}
          name="Predicted"
          connectNulls
        />

        {/* Actual — solid blue, only past data */}
        <Line
          type="monotone"
          dataKey="actual"
          stroke="#1d4ed8"
          strokeWidth={2.5}
          dot={false}
          name="Actual"
          connectNulls={false}
        />

        {/* Today vertical reference line */}
        <ReferenceLine
          x={todayLabel}
          stroke="#6b7280"
          strokeDasharray="4 3"
          label={{
            value: "Today",
            position: "insideTopRight",
            fontSize: 11,
            fill: "#6b7280",
            offset: 6,
          }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
