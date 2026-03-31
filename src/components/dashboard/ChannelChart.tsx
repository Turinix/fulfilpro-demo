"use client";

/**
 * ChannelChart — Recharts horizontal bar chart showing order counts per channel.
 * Receives channelData as a serializable prop from the server component (page.tsx).
 * Props: channelData — array of { channel, count } objects.
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ChannelDataPoint {
  channel: string;
  count: number;
}

interface ChannelChartProps {
  channelData: ChannelDataPoint[];
}

const CHANNEL_COLORS: Record<string, string> = {
  shopify: "#22c55e",
  amazon: "#f97316",
  website: "#3b82f6",
  instagram: "#ec4899",
};

const CHANNEL_LABELS: Record<string, string> = {
  shopify: "Shopify",
  amazon: "Amazon",
  website: "Website",
  instagram: "Instagram",
};

export default function ChannelChart({ channelData }: ChannelChartProps) {
  const data = channelData.map((d) => ({
    ...d,
    label: CHANNEL_LABELS[d.channel] ?? d.channel,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data}
        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
        layout="vertical"
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
        <XAxis type="number" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fontSize: 13, fill: "#374151" }}
          axisLine={false}
          tickLine={false}
          width={80}
        />
        <Tooltip
          formatter={(value) => [`${value} orders`, "Orders"]}
          contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 }}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={32}>
          {data.map((entry) => (
            <Cell
              key={entry.channel}
              fill={CHANNEL_COLORS[entry.channel] ?? "#6b7280"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
