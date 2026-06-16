"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VatInvoiceInfo } from "@/features/ecommerce/components/vat-invoice-info";
import { ProviderSubmitButton } from "@/features/provider-orders/components/provider-buttons";
import { ProviderField, ProviderInput, ProviderSelect, ProviderTextarea } from "@/features/provider-orders/components/provider-form";
import { useRealtimeResource } from "@/features/realtime/use-realtime-resource";
import { providerApi } from "@/lib/api-client.provider";
import { ROUTES } from "@/lib/routes";
import { getFulfillmentStatusLabel, getOrderStatusLabel, getPaymentStatusLabel, getProviderAssignmentStatusLabel } from "@/lib/status-labels";
import type { ProviderAssignmentStatus, ProviderOrderDetail } from "@/features/provider-orders/types";

const PROVIDER_STATUSES: ProviderAssignmentStatus[] = [
  "pending_confirmation",
  "accepted",
  "in_progress",
  "ready_for_review",
  "completed",
  "cancelled",
];

const ACTOR_LABELS = {
  admin: "Admin",
  provider: "Đối tác",
  system: "Hệ thống",
} as const;

type ProviderAssignmentPanelProps = {
  detailUrl: string;
  portalHref: string;
  initialDetail: ProviderOrderDetail;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

function formatProviderEventMessage(message: string) {
  return message
    .replaceAll("pending_confirmation", getProviderAssignmentStatusLabel("pending_confirmation"))
    .replaceAll("ready_for_review", getProviderAssignmentStatusLabel("ready_for_review"))
    .replaceAll("in_progress", getProviderAssignmentStatusLabel("in_progress"))
    .replaceAll("accepted", getProviderAssignmentStatusLabel("accepted"))
    .replaceAll("completed", getProviderAssignmentStatusLabel("completed"))
    .replaceAll("cancelled", getProviderAssignmentStatusLabel("cancelled"));
}

export function ProviderAssignmentPanel({
  detailUrl,
  portalHref,
  initialDetail,
}: ProviderAssignmentPanelProps) {
  const router = useRouter();
  const [detail, setDetail] = useState<ProviderOrderDetail>(initialDetail);
  const [status, setStatus] = useState<ProviderAssignmentStatus>(initialDetail.assignment.status);
  const [providerReference, setProviderReference] = useState(initialDetail.assignment.providerReference);
  const [providerNote, setProviderNote] = useState(initialDetail.assignment.providerNote);
  const [isSaving, setIsSaving] = useState(false);
  const skipNextRealtimeToastRef = useRef(false);

  useEffect(() => {
    setStatus(detail.assignment.status);
    setProviderReference(detail.assignment.providerReference);
    setProviderNote(detail.assignment.providerNote);
  }, [detail]);

  const loadDetail = useCallback(async () => {
    try {
      return await providerApi.fetchRequiredProviderOrderDetail(detailUrl);
    } catch (error) {
      if (error instanceof Error && error.message === "not_found") {
        router.replace(`${portalHref}?error=assignment_not_found`);
        throw new Error("ASSIGNMENT_NOT_FOUND");
      }
      throw error;
    }
  }, [detailUrl, portalHref, router]);

  useRealtimeResource({
    enabled: true,
    streamUrl: ROUTES.API.PROVIDER.REALTIME.ASSIGNMENT(detail.assignment.id),
    changedEvent: "provider-assignment.changed",
    deletedEvent: "provider-assignment.deleted",
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
      formData.set("providerReference", providerReference);
      formData.set("providerNote", providerNote);

      skipNextRealtimeToastRef.current = true;
      const result = await providerApi.updateProviderAssignment(formData);
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
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-base font-semibold">Tổng quan xử lý</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 pt-5 text-sm sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-md border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Trạng thái</p>
              <p className="mt-1 font-medium">{getProviderAssignmentStatusLabel(detail.assignment.status)}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Đơn hàng</p>
              <p className="mt-1 font-medium">{getOrderStatusLabel(detail.order.status)}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Thanh toán</p>
              <p className="mt-1 font-medium">{getPaymentStatusLabel(detail.order.paymentStatus)}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Cập nhật gần nhất</p>
              <p className="mt-1 font-medium">{formatDateTime(detail.assignment.updatedAt)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-base font-semibold">Ghi chú đơn hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-5 text-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-md border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Khách hàng</p>
                <p className="mt-1 font-medium">{detail.order.customerName}</p>
                <p className="text-muted-foreground">{detail.order.customerPhone || "Chưa có số điện thoại"}</p>
                <p className="text-muted-foreground">{detail.order.customerEmail || "Chưa có email"}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Giao hàng</p>
                <p className="mt-1 font-medium">{getFulfillmentStatusLabel(detail.order.fulfillmentStatus)}</p>
                <p className="text-muted-foreground">
                  {[detail.order.shippingLine1, detail.order.shippingLine2, detail.order.shippingWard, detail.order.shippingDistrict, detail.order.shippingCity]
                    .filter(Boolean)
                    .join(", ") || "Không có thông tin giao hàng"}
                </p>
              </div>
            </div>

            {detail.order.notes ? (
              <div className="rounded-md border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Ghi chú từ đơn hàng</p>
                <p className="mt-1">{detail.order.notes}</p>
              </div>
            ) : null}

            {detail.order.metadata.requestVatInvoice ? (
              <div className="rounded-md border border-primary/30 bg-primary/10 p-3">
                <p className="text-xs uppercase tracking-wide text-primary">Hóa đơn VAT</p>
                <div className="mt-3">
                  <VatInvoiceInfo info={detail.order.metadata.vatInvoiceInfo} />
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-base font-semibold">Lịch sử cập nhật</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {detail.events.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có cập nhật nào.</p>
            ) : (
              detail.events.map((eventItem) => (
                <div key={eventItem.id} className="rounded-md border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{formatProviderEventMessage(eventItem.message)}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(eventItem.createdAt)}</p>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {ACTOR_LABELS[eventItem.actorType]}{eventItem.actorUsername ? ` • ${eventItem.actorUsername}` : ""}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-5 xl:col-span-4 xl:sticky xl:top-5 xl:self-start">
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-base font-semibold">Cập nhật tiến độ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="hidden" name="assignmentId" value={detail.assignment.id} />
              <ProviderField label="Trạng thái xử lý">
                <ProviderSelect name="status" value={status} onChange={(event) => setStatus(event.target.value as ProviderAssignmentStatus)}>
                  {PROVIDER_STATUSES.map((item) => (
                    <option key={item} value={item}>
                      {getProviderAssignmentStatusLabel(item)}
                    </option>
                  ))}
                </ProviderSelect>
              </ProviderField>

              <ProviderField label="Mã tham chiếu">
                <ProviderInput
                  name="providerReference"
                  value={providerReference}
                  onChange={(event) => setProviderReference(event.target.value)}
                  placeholder="Ví dụ: PO, mã nội bộ, mã vận đơn"
                />
              </ProviderField>

              <ProviderField label="Ghi chú cập nhật">
                <ProviderTextarea
                  name="providerNote"
                  value={providerNote}
                  onChange={(event) => setProviderNote(event.target.value)}
                  className="min-h-32"
                  placeholder="Ghi rõ tiến độ, vướng mắc hoặc thời gian dự kiến"
                />
              </ProviderField>

              <ProviderSubmitButton type="submit" className="w-full" disabled={isSaving}>
                {isSaving ? "Đang lưu..." : "Lưu cập nhật"}
              </ProviderSubmitButton>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
