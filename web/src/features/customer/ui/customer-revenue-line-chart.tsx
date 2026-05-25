"use client";

import {
  RevenueLineChartTemplate,
  type RevenueLineChartPoint,
} from "@/components/common/revenue-line-chart-template";

type CustomerRevenueLineChartProps = {
  data: RevenueLineChartPoint[];
};

export function CustomerRevenueLineChart({ data }: CustomerRevenueLineChartProps) {
  return (
    <RevenueLineChartTemplate
      data={data}
      gradientId="customer-revenue-fill"
      tooltipOrderLabel="conversion"
    />
  );
}
