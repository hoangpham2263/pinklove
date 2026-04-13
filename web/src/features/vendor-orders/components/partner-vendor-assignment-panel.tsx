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

const ACTOR_LABELS = {
  admin: "Admin",
  vendor: "Đối tác",
  system: "Hệ thống",
} as const;

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

function formatVendorEventMessage(message: string) {
  return message
    .replaceAll("pending_confirmation", getVendorAssignmentStatusLabel("pending_confirmation"))
    .replaceAll("ready_for_review", getVendorAssignmentStatusLabel("ready_for_review"))
    .replaceAll("in_progress", getVendorAssignmentStatusLabel("in_progress"))
    .replaceAll("accepted", getVendorAssignmentStatusLabel("accepted"))
    .replaceAll("completed", getVendorAssignmentStatusLabel("completed"))
    .replaceAll("cancelled", getVendorAssignmentStatusLabel("cancelled"));
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

  useRealtimeResource({
    enabled: true,
    streamUrl: ROUTES.API.PARTNER.REALTIME.ASSIGNMENT(detail.assignment.id),
    changedEvent: "vendor-assignment.changed",
    deletedEvent: "vendor-assignment.deleted",
    load: loadDetail,
    onData: (nextDetail) => {
      if (skipNextRealtimeToastRef.current) {
        skipNextRealtimeToastRef.current = false;
      } else {
        toast.info("Admin vừa cập nhật đơn hàng của bạn.");
      }
      setDetail(nextDetail);
    },
    onDeleted: () => {
      router.replace(`${portalHref}?error=assignment_not_found`);
    },
    onError: () => {
      toast.error("Không thể tải lại cập nhật đơn hàng.");
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
      toast.success(result.message ? String(result.message) : "Đã lưu cập nhật.");

      setDetail(await loadDetail());
    } catch (error) {
      skipNextRealtimeToastRef.current = false;
      toast.error(error instanceof Error ? error.message : "Không thể lưu cập nhật.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
      <div className="space-y-5 xl:col-span-8">
        <Card className="border-zinc-200/80 bg-white/90">
          <CardHeader className="border-b">
            <CardTitle className="text-base font-semibold text-zinc-950">Tổng quan xử lý</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 pt-5 text-sm sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-zinc-200/80 p-3">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Trạng thái</p>
              <p className="mt-1 font-medium text-zinc-950">{getVendorAssignmentStatusLabel(detail.assignment.status)}</p>
            </div>
            <div className="rounded-xl border border-zinc-200/80 p-3">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Đơn hàng</p>
              <p className="mt-1 font-medium text-zinc-950">{getOrderStatusLabel(detail.order.status)}</p>
            </div>
            <div className="rounded-xl border border-zinc-200/80 p-3">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Thanh toán</p>
              <p className="mt-1 font-medium text-zinc-950">{getPaymentStatusLabel(detail.order.paymentStatus)}</p>
            </div>
            <div className="rounded-xl border border-zinc-200/80 p-3">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Cập nhật gần nhất</p>
              <p className="mt-1 font-medium text-zinc-950">{formatDateTime(detail.assignment.updatedAt)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/80 bg-white/90">
          <CardHeader className="border-b">
            <CardTitle className="text-base font-semibold text-zinc-950">Ghi chú đơn hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-5 text-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-zinc-200/80 p-3">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Khách hàng</p>
                <p className="mt-1 font-medium text-zinc-950">{detail.order.customerName}</p>
                <p className="text-zinc-600">{detail.order.customerPhone || "Chưa có số điện thoại"}</p>
                <p className="text-zinc-600">{detail.order.customerEmail || "Chưa có email"}</p>
              </div>
              <div className="rounded-xl border border-zinc-200/80 p-3">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Giao hàng</p>
                <p className="mt-1 font-medium text-zinc-950">{getFulfillmentStatusLabel(detail.order.fulfillmentStatus)}</p>
                <p className="text-zinc-600">
                  {[detail.order.shippingLine1, detail.order.shippingLine2, detail.order.shippingWard, detail.order.shippingDistrict, detail.order.shippingCity]
                    .filter(Boolean)
                    .join(", ") || "Không có thông tin giao hàng"}
                </p>
              </div>
            </div>

            {detail.order.notes ? (
              <div className="rounded-xl border border-zinc-200/80 p-3">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Ghi chú từ đơn hàng</p>
                <p className="mt-1 text-zinc-900">{detail.order.notes}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-zinc-200/80 bg-white/90">
          <CardHeader className="border-b">
            <CardTitle className="text-base font-semibold text-zinc-950">Lịch sử cập nhật</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {detail.events.length === 0 ? (
              <p className="text-sm text-zinc-500">Chưa có cập nhật nào.</p>
            ) : (
              detail.events.map((eventItem) => (
                <div key={eventItem.id} className="rounded-xl border border-zinc-200/80 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-zinc-950">{formatVendorEventMessage(eventItem.message)}</p>
                    <p className="text-xs text-zinc-500">{formatDateTime(eventItem.createdAt)}</p>
                  </div>
                  <p className="mt-1 text-zinc-600">
                    {ACTOR_LABELS[eventItem.actorType]}{eventItem.actorUsername ? ` • ${eventItem.actorUsername}` : ""}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-5 xl:col-span-4 xl:sticky xl:top-5 xl:self-start">
        <Card className="border-zinc-200/80 bg-white/90">
          <CardHeader className="border-b">
            <CardTitle className="text-base font-semibold text-zinc-950">Cập nhật tiến độ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="hidden" name="assignmentId" value={detail.assignment.id} />
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-950">Trạng thái xử lý</label>
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
                <label className="text-sm font-medium text-zinc-950">Mã tham chiếu</label>
                <input
                  name="vendorReference"
                  value={vendorReference}
                  onChange={(event) => setVendorReference(event.target.value)}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  placeholder="Ví dụ: PO, mã nội bộ, mã vận đơn"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-950">Ghi chú cập nhật</label>
                <textarea
                  name="vendorNote"
                  value={vendorNote}
                  onChange={(event) => setVendorNote(event.target.value)}
                  className="min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="Ghi rõ tiến độ, vướng mắc hoặc thời gian dự kiến"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving ? "Đang lưu..." : "Lưu cập nhật"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
