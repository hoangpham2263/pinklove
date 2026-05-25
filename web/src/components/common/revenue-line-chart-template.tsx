"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCompactVnd, formatVnd } from "@/lib/currency";

export type RevenueLineChartPoint = {
  day: string;
  label: string;
  revenueValue: number;
  orderCount: number;
};

export type RevenueLineChartTemplateProps = {
  data: RevenueLineChartPoint[];
  tooltipOrderLabel?: string;
  gradientId: string;
};

type RevenueTooltipProps = {
  active?: boolean;
  payload?: ReadonlyArray<{ payload: RevenueLineChartPoint }>;
};

export function RevenueLineChartTemplate({
  data,
  tooltipOrderLabel = "giao dịch",
  gradientId,
}: RevenueLineChartTemplateProps) {
  const renderTooltip = ({ active, payload }: RevenueTooltipProps) => {
    const item = payload?.[0]?.payload;

    if (!active || !item) {
      return null;
    }

    return (
      <div className="rounded-xl border border-border bg-background px-3 py-2 shadow-sm">
        <p className="text-xs text-muted-foreground">{item.label} • {item.day}</p>
        <p className="mt-1 text-sm font-medium text-foreground">{formatVnd(item.revenueValue)}</p>
        <p className="text-xs text-muted-foreground">
          {item.orderCount.toLocaleString("vi-VN")} {tooltipOrderLabel}
        </p>
      </div>
    );
  };

  return (
    <div className="h-full min-h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
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
            tickFormatter={(value) => formatCompactVnd(Number(value))}
          />
          <Tooltip
            cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
            content={(props) => renderTooltip(props as RevenueTooltipProps)}
          />
          <Area
            type="monotone"
            dataKey="revenueValue"
            stroke="none"
            fill={`url(#${gradientId})`}
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
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
