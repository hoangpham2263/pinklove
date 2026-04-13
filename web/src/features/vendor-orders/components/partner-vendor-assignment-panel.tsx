"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRealtimeResource } from "@/features/realtime/use-realtime-resource";
import { postForm } from "@/lib/client-mutation";
import { ROUTES } from "@/lib/routes";
import { getFulfillmentStatusLabel, getOrderStatusLabel, getPaymentStatusLabel, getVendorAssignmentStatusLabel } from "@/lib/status-labels";
import type { VendorAssignmentStatus, VendorOrderDetail } from "@/features/vendor-orders/types";

const VENDOR_STATUSES: VendorAssignmentStatus[] = [
  "pending_confirmation",
  "accepted",
  "in_progress",
  "ready_for_review",
  "completed",
  "cancelled",
];

type PartnerVendorAssignmentPanelProps = {
  detailUrl: string;
  submitUrl: string;
  portalHref: string;
  initialDetail: VendorOrderDetail;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

export function PartnerVendorAssignmentPanel({
  detailUrl,
  submitUrl,
  portalHref,
  initialDetail,
}: PartnerVendorAssignmentPanelProps) {
  const router = useRouter();
  const [detail, setDetail] = useState<VendorOrderDetail>(initialDetail);
  const [status, setStatus] = useState<VendorAssignmentStatus>(initialDetail.assignment.status);
  const [vendorReference, setVendorReference] = useState(initialDetail.assignment.vendorReference);
  const [vendorNote, setVendorNote] = useState(initialDetail.assignment.vendorNote);
  const [isSaving, setIsSaving] = useState(false);
  const skipNextRealtimeToastRef = useRef(false);

  useEffect(() => {
    setStatus(detail.assignment.status);
    setVendorReference(detail.assignment.vendorReference);
    setVendorNote(detail.assignment.vendorNote);
  }, [detail]);

  const loadDetail = useCallback(async () => {
    const response = await fetch(detailUrl, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      credentials: "same-origin",
    });

    if (response.status === 404) {
      router.replace(`${portalHref}?error=assignment_not_found`);
      throw new Error("ASSIGNMENT_NOT_FOUND");
    }

    if (!response.ok) {
      throw new Error("LOAD_FAILED");
    }

    const data = (await response.json()) as { detail?: VendorOrderDetail };
    if (!data.detail) {
      throw new Error("LOAD_FAILED");
    }

    return data.detail;
  }, [detailUrl, portalHref, router]);

  const { status: liveStatus } = useRealtimeResource({
    enabled: true,
    streamUrl: ROUTES.API.PARTNER.REALTIME.ASSIGNMENT(detail.assignment.id),
    changedEvent: "vendor-assignment.changed",
    deletedEvent: "vendor-assignment.deleted",
    load: loadDetail,
    onData: (nextDetail) => {
      if (skipNextRealtimeToastRef.current) {
        skipNextRealtimeToastRef.current = false;
      } else {
        toast.info("Admin vua cap nhat don hang cua ban.");
      }
      setDetail(nextDetail);
    },
    onDeleted: () => {
      router.replace(`${portalHref}?error=assignment_not_found`);
    },
    onError: () => {
      toast.error("Khong the tai lai cap nhat vendor.");
    },
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.set("assignmentId", detail.assignment.id);
      formData.set("status", status);
      formData.set("vendorReference", vendorReference);
      formData.set("vendorNote", vendorNote);

      skipNextRealtimeToastRef.current = true;
      const result = await postForm(submitUrl, formData);
      toast.success(result.message ? String(result.message) : "Da luu cap nhat vendor.");

      setDetail(await loadDetail());
    } catch (error) {
      skipNextRealtimeToastRef.current = false;
      toast.error(error instanceof Error ? error.message : "Khong the luu cap nhat vendor.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      <div className="space-y-5 lg:col-span-9">
        <div className="rounded-md border border-dashed bg-background/70 px-3 py-2 text-xs text-muted-foreground">
          Realtime: {liveStatus === "live" ? "live" : liveStatus === "retrying" ? "reconnecting" : "connecting"}
        </div>

        <div className="space-y-3 rounded-md border bg-muted/20 p-3 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Trang thai don</p>
            <p className="mt-1 font-medium">{getOrderStatusLabel(detail.order.status)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Thanh toan</p>
            <p className="mt-1 font-medium">{getPaymentStatusLabel(detail.order.paymentStatus)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Fulfillment</p>
            <p className="mt-1 font-medium">{getFulfillmentStatusLabel(detail.order.fulfillmentStatus)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Cap nhat don gan nhat</p>
            <p className="mt-1 font-medium">{formatDateTime(detail.order.updatedAt)}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Timeline phối hợp</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {detail.events.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chua co activity nao.</p>
            ) : (
              detail.events.map((eventItem) => (
                <div key={eventItem.id} className="rounded-md border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{eventItem.message}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(eventItem.createdAt)}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {eventItem.actorType} {eventItem.actorUsername ? `- ${eventItem.actorUsername}` : ""}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-5 lg:col-span-3 lg:sticky lg:top-5 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle>Cập nhật trạng thái vendor</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="hidden" name="assignmentId" value={detail.assignment.id} />
              <div className="space-y-2">
                <label className="text-sm font-medium">Trang thai vendor</label>
                <select
                  name="status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as VendorAssignmentStatus)}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  {VENDOR_STATUSES.map((item) => (
                    <option key={item} value={item}>
                      {getVendorAssignmentStatusLabel(item)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Ma tham chieu vendor</label>
                <input
                  name="vendorReference"
                  value={vendorReference}
                  onChange={(event) => setVendorReference(event.target.value)}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  placeholder="PO, ma noi bo, tracking..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Ghi chu cap nhat</label>
                <textarea
                  name="vendorNote"
                  value={vendorNote}
                  onChange={(event) => setVendorNote(event.target.value)}
                  className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="Mo ta tien do, vuong mac, thoi gian du kien..."
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving ? "Dang luu..." : "Luu cap nhat vendor"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
