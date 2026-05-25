"use client";

import {
  RevenueLineChartTemplate,
  type RevenueLineChartPoint,
} from "@/components/common/revenue-line-chart-template";

type ProviderRevenueLineChartProps = {
  data: RevenueLineChartPoint[];
};

export function ProviderRevenueLineChart({ data }: ProviderRevenueLineChartProps) {
  return (
    <RevenueLineChartTemplate
      data={data}
      gradientId="provider-revenue-fill"
      tooltipOrderLabel="đơn liên quan"
    />
  );
}
