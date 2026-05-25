"use client";

import {
  RevenueLineChartTemplate,
  type RevenueLineChartPoint,
} from "@/components/common/revenue-line-chart-template";

type AdminRevenueLineChartProps = {
  data: RevenueLineChartPoint[];
};

export function AdminRevenueLineChart({ data }: AdminRevenueLineChartProps) {
  return (
    <RevenueLineChartTemplate
      data={data}
      gradientId="admin-revenue-fill"
      tooltipOrderLabel="đơn đã thanh toán"
    />
  );
}
