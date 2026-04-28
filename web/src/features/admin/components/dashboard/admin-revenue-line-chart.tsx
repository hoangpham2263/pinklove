"use client";

import {
  Area,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type AdminRevenueLineChartPoint = {
  day: string;
  label: string;
  revenueValue: number;
  orderCount: number;
};

type AdminRevenueLineChartProps = {
  data: AdminRevenueLineChartPoint[];
};

type RevenueTooltipProps = {
  active?: boolean;
  payload?: ReadonlyArray<{ payload: AdminRevenueLineChartPoint }>;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactCurrency(value: number) {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toLocaleString("vi-VN");
}

export function AdminRevenueLineChart({ data }: AdminRevenueLineChartProps) {
  const renderTooltip = ({ active, payload }: RevenueTooltipProps) => {
    const item = payload?.[0]?.payload;

    if (!active || !item) {
      return null;
    }

    return (
      <div className="rounded-xl border border-border bg-background px-3 py-2 shadow-sm">
        <p className="text-xs text-muted-foreground">{item.label} • {item.day}</p>
        <p className="mt-1 text-sm font-medium text-foreground">{formatCurrency(item.revenueValue)}</p>
        <p className="text-xs text-muted-foreground">{item.orderCount.toLocaleString("vi-VN")} đơn đã thanh toán</p>
      </div>
    );
  };

  return (
    <div className="h-full min-h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
          <defs>
            <linearGradient id="admin-revenue-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.24} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={4}
            fontSize={12}
            stroke="var(--muted-foreground)"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={4}
            width={44}
            fontSize={12}
            stroke="var(--muted-foreground)"
            tickFormatter={(value) => formatCompactCurrency(Number(value))}
          />
          <Tooltip
            cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
            content={(props) => renderTooltip(props as RevenueTooltipProps)}
          />
          <Area
            type="monotone"
            dataKey="revenueValue"
            stroke="none"
            fill="url(#admin-revenue-fill)"
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="revenueValue"
            stroke="var(--primary)"
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            connectNulls
            isAnimationActive={false}
            dot={{ r: 4, fill: "var(--primary)", stroke: "var(--background)", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "var(--primary)", stroke: "var(--background)", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
