"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRealtimeResource } from "@/features/realtime/use-realtime-resource";
import type { VendorOrderSummary } from "@/features/vendor-orders/types";
import { ROUTES } from "@/lib/routes";
import { getVendorAssignmentStatusLabel } from "@/lib/status-labels";

type VendorPortalStats = {
  total: number;
  active: number;
  review: number;
  completed: number;
};

type PartnerVendorPortalPanelProps = {
  summaryUrl: string;
  initialStats: VendorPortalStats;
  initialAssignments: VendorOrderSummary[];
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

export function PartnerVendorPortalPanel({
  summaryUrl,
  initialStats,
  initialAssignments,
}: PartnerVendorPortalPanelProps) {
  const [stats, setStats] = useState(initialStats);
  const [assignments, setAssignments] = useState(initialAssignments);
  const [realtimeStatus, setRealtimeStatus] = useState<"connecting" | "live" | "retrying">("connecting");

  useEffect(() => {
    setStats(initialStats);
    setAssignments(initialAssignments);
  }, [initialAssignments, initialStats]);

  const loadSummary = useCallback(async () => {
    const response = await fetch(summaryUrl, {
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });

    if (!response.ok) {
      throw new Error("LOAD_FAILED");
    }

    return (await response.json()) as {
      stats?: VendorPortalStats;
      assignments?: VendorOrderSummary[];
    };
  }, [summaryUrl]);

  const { status: liveStatus } = useRealtimeResource({
    enabled: true,
    streamUrl: ROUTES.API.PARTNER.REALTIME.PORTAL,
    changedEvent: "vendor-portal.changed",
    load: loadSummary,
    onData: (data) => {
      toast.info("Danh sach don vendor vua duoc cap nhat.");
      setStats(data.stats ?? initialStats);
      setAssignments(data.assignments ?? []);
    },
    onError: () => {
      toast.error("Khong the tai lai danh sach don vendor.");
    },
  });

  useEffect(() => {
    setRealtimeStatus(liveStatus);
  }, [liveStatus]);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-white/92 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tong don duoc giao</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/92 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Dang xu ly</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{stats.active}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/92 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cho review</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{stats.review}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/92 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Hoan tat</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{stats.completed}</p>
          </CardContent>
        </Card>
      </div>

      {assignments[0] ? (
        <div className="rounded-2xl border border-dashed bg-white/80 px-4 py-3 text-xs text-zinc-500">
          Realtime: {realtimeStatus === "live" ? "live" : realtimeStatus === "retrying" ? "reconnecting" : "connecting"}
        </div>
      ) : null}

      <Card className="border-zinc-200/80 bg-white/94 shadow-sm">
        <CardHeader className="border-b">
          <CardTitle>Don hang duoc giao</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          {assignments.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-6 text-sm text-zinc-500">
              Chua co don nao duoc giao cho doi tac nay.
            </div>
          ) : (
            assignments.map((entry) => (
              <div key={entry.assignment.id} className="grid gap-4 rounded-2xl border border-zinc-200/80 p-4 lg:grid-cols-[minmax(0,1fr)_220px_160px] lg:items-center">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-zinc-950">{entry.order.orderNumber}</p>
                    <Badge className="border border-zinc-200 bg-zinc-50 text-zinc-600">
                      {getVendorAssignmentStatusLabel(entry.assignment.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-zinc-600">
                    {entry.order.customerName} - {entry.items.map((item) => `${item.productName} x${item.quantity}`).join(", ")}
                  </p>
                  <p className="text-sm text-zinc-500">{entry.lastEvent?.message || "Chua co cap nhat moi."}</p>
                </div>
                <div className="text-sm text-zinc-500">
                  <p>Cap nhat gan nhat</p>
                  <p className="mt-1 font-medium text-zinc-900">{formatDateTime(entry.assignment.updatedAt)}</p>
                </div>
                <div className="flex justify-start lg:justify-end">
                  <Button variant="outline" render={<Link href={ROUTES.PARTNER.ORDER(entry.assignment.id)}>Mo chi tiet</Link>} />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </>
  );
}
