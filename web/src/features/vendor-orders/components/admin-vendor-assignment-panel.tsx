"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AdminLinkButton, AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRealtimeResource } from "@/features/realtime/use-realtime-resource";
import { adminApi } from "@/lib/api-client.admin";
import { ROUTES } from "@/lib/routes";
import { getVendorAssignmentStatusLabel } from "@/lib/status-labels";
import type { VendorOrderDetail } from "@/features/vendor-orders/types";

type VendorOption = {
  id: string;
  label: string;
};

type AdminVendorAssignmentPanelProps = {
  orderId: string;
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
  detailUrl,
  initialDetail,
  vendorOptions,
}: AdminVendorAssignmentPanelProps) {
  const [detail, setDetail] = useState<VendorOrderDetail | null>(initialDetail);
  const [vendorUserId, setVendorUserId] = useState(initialDetail?.assignment.vendorUserId ?? "");
  const [internalNote, setInternalNote] = useState(initialDetail?.assignment.internalNote ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const skipNextRealtimeToastRef = useRef(false);

  useEffect(() => {
    setVendorUserId(detail?.assignment.vendorUserId ?? "");
    setInternalNote(detail?.assignment.internalNote ?? "");
  }, [detail]);

  const loadDetail = useCallback(async () => {
    return adminApi.fetchVendorOrderDetail(detailUrl);
  }, [detailUrl]);

  useRealtimeResource({
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.set("orderId", orderId);
      formData.set("vendorUserId", vendorUserId);
      formData.set("internalNote", internalNote);

      skipNextRealtimeToastRef.current = true;
      const result = await adminApi.saveVendorAssignment(formData);
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
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
      <div className="space-y-5 xl:col-span-8">
        <Card>
          <CardHeader>
            <CardTitle>Theo dõi vendor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {detail ? (
              <>
                <div className="grid gap-3 xl:grid-cols-4">
                  <div className="rounded-md border bg-muted/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Vendor phụ trách</p>
                    <p className="mt-1 font-medium">{detail.assignment.vendorDisplayName}</p>
                  </div>
                  <div className="rounded-md border bg-muted/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Trạng thái vendor</p>
                    <p className="mt-1 font-medium">{getVendorAssignmentStatusLabel(detail.assignment.status)}</p>
                  </div>
                  <div className="rounded-md border bg-muted/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Vendor ref</p>
                    <p className="mt-1 font-medium">{detail.assignment.vendorReference || "Chua co"}</p>
                  </div>
                  <div className="rounded-md border bg-muted/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Cập nhật gần nhất</p>
                    <p className="mt-1 font-medium">{formatDateTime(detail.assignment.updatedAt)}</p>
                  </div>
                </div>

                <div className="rounded-md border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Vendor note</p>
                  <p className="mt-1">{detail.assignment.vendorNote || "Chua co"}</p>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Don nay chua duoc phan cong cho vendor nao.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timeline phối hợp</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {detail && detail.events.length > 0 ? (
              detail.events.map((eventItem) => (
                <div key={eventItem.id} className="rounded-md border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{eventItem.message}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(eventItem.createdAt)}</p>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {eventItem.actorType} {eventItem.actorUsername ? `- ${eventItem.actorUsername}` : ""}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Chua co activity nao.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-5 xl:col-span-4 xl:sticky xl:top-5 xl:self-start">
        <Card>
          <CardHeader>
            <CardTitle>Phân công vendor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

              <AdminSubmitButton className="w-full" disabled={isSaving || !vendorUserId}>
                {isSaving ? "Dang luu..." : "Luu phan cong vendor"}
              </AdminSubmitButton>
            </form>

            {detail ? (
              <AdminLinkButton className="w-full" href={ROUTES.ADMIN.VENDOR(detail.assignment.vendorUserId)}>
                Mo workspace vendor
              </AdminLinkButton>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
