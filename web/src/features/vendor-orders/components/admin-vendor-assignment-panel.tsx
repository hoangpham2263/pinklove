"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useRealtimeResource } from "@/features/realtime/use-realtime-resource";
import { postForm } from "@/lib/client-mutation";
import { ROUTES } from "@/lib/routes";
import { getVendorAssignmentStatusLabel } from "@/lib/status-labels";
import type { VendorOrderDetail } from "@/features/vendor-orders/types";

type VendorOption = {
  id: string;
  label: string;
};

type AdminVendorAssignmentPanelProps = {
  orderId: string;
  submitUrl: string;
  detailUrl: string;
  initialDetail: VendorOrderDetail | null;
  vendorOptions: VendorOption[];
};

function formatDateTime(value?: string) {
  if (!value) return "Chua co";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

export function AdminVendorAssignmentPanel({
  orderId,
  submitUrl,
  detailUrl,
  initialDetail,
  vendorOptions,
}: AdminVendorAssignmentPanelProps) {
  const [detail, setDetail] = useState<VendorOrderDetail | null>(initialDetail);
  const [vendorUserId, setVendorUserId] = useState(initialDetail?.assignment.vendorUserId ?? "");
  const [internalNote, setInternalNote] = useState(initialDetail?.assignment.internalNote ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<"connecting" | "live" | "retrying">(
    initialDetail ? "connecting" : "live"
  );
  const skipNextRealtimeToastRef = useRef(false);

  useEffect(() => {
    setVendorUserId(detail?.assignment.vendorUserId ?? "");
    setInternalNote(detail?.assignment.internalNote ?? "");
  }, [detail]);

  const loadDetail = useCallback(async () => {
    const response = await fetch(detailUrl, {
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });

    if (!response.ok) {
      throw new Error("LOAD_FAILED");
    }

    const data = (await response.json()) as { detail?: VendorOrderDetail | null };
    return data.detail ?? null;
  }, [detailUrl]);

  const { status: liveStatus } = useRealtimeResource({
    enabled: Boolean(detail?.assignment.id),
    streamUrl: detail?.assignment.id ? ROUTES.API.ADMIN.REALTIME.ASSIGNMENT(detail.assignment.id) : "",
    changedEvent: "vendor-assignment.changed",
    deletedEvent: "vendor-assignment.deleted",
    load: loadDetail,
    onData: (nextDetail) => {
      if (skipNextRealtimeToastRef.current) {
        skipNextRealtimeToastRef.current = false;
      } else if (nextDetail?.lastEvent?.actorType === "vendor") {
        toast.info("Vendor vua cap nhat tien do don hang.");
      }
      setDetail(nextDetail);
    },
    onDeleted: () => {
      setDetail(null);
      toast.info("Assignment da bi xoa.");
    },
    onError: () => {
      toast.error("Khong the tai lai du lieu vendor.");
    },
  });

  useEffect(() => {
    setRealtimeStatus(liveStatus);
  }, [liveStatus]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.set("orderId", orderId);
      formData.set("vendorUserId", vendorUserId);
      formData.set("internalNote", internalNote);

      skipNextRealtimeToastRef.current = true;
      const result = await postForm(submitUrl, formData);
      toast.success(result.message ? String(result.message) : "Da luu phan cong vendor.");

      setDetail(await loadDetail());
    } catch (error) {
      skipNextRealtimeToastRef.current = false;
      toast.error(error instanceof Error ? error.message : "Khong the luu phan cong vendor.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {detail ? (
        <div className="rounded-md border border-dashed bg-background/70 px-3 py-2 text-xs text-muted-foreground">
          Realtime: {realtimeStatus === "live" ? "live" : realtimeStatus === "retrying" ? "reconnecting" : "connecting"}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="font-medium">Vendor phu trach</label>
          <select
            name="vendorUserId"
            value={vendorUserId}
            onChange={(event) => setVendorUserId(event.target.value)}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="" disabled>
              Chon vendor
            </option>
            {vendorOptions.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="font-medium">Ghi chu noi bo</label>
          <textarea
            name="internalNote"
            value={internalNote}
            onChange={(event) => setInternalNote(event.target.value)}
            className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Scope cong viec, deadline, dau moi ban giao..."
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSaving || !vendorUserId}>
          {isSaving ? "Dang luu..." : "Luu phan cong vendor"}
        </Button>
      </form>

      {detail ? (
        <div className="space-y-5">
          <div className="rounded-md border p-3 text-sm">
            <p><span className="font-medium">Vendor:</span> {detail.assignment.vendorDisplayName}</p>
            <p><span className="font-medium">Trang thai:</span> {getVendorAssignmentStatusLabel(detail.assignment.status)}</p>
            <p><span className="font-medium">Vendor ref:</span> {detail.assignment.vendorReference || "Chua co"}</p>
            <p><span className="font-medium">Vendor note:</span> {detail.assignment.vendorNote || "Chua co"}</p>
            <p><span className="font-medium">Cap nhat gan nhat:</span> {formatDateTime(detail.assignment.updatedAt)}</p>
            <div className="pt-3">
              <Button
                variant="outline"
                className="w-full"
                render={<Link href={ROUTES.ADMIN.VENDOR(detail.assignment.vendorUserId)}>Mo workspace vendor nay</Link>}
              />
            </div>
          </div>

          <div className="space-y-3">
            {detail.events.map((eventItem) => (
              <div key={eventItem.id} className="rounded-md border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{eventItem.message}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(eventItem.createdAt)}</p>
                </div>
                <p className="mt-1 text-muted-foreground">
                  {eventItem.actorType} {eventItem.actorUsername ? `- ${eventItem.actorUsername}` : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Don nay chua duoc phan cong cho vendor nao.</p>
      )}
    </div>
  );
}
