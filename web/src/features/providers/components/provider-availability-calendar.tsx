"use client";

import { useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import viLocale from "@fullcalendar/core/locales/vi";
import type { DateSelectArg, EventClickArg, EventDropArg, EventInput } from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ProviderAvailabilityRule } from "@/features/providers/server/availability";
import { providerApi } from "@/lib/api-client.provider";

type ProviderAvailabilityCalendarProps = {
  rules: ProviderAvailabilityRule[];
};

const STATUS_LABELS: Record<ProviderAvailabilityRule["status"], string> = {
  available: "Nhận lịch",
  unavailable: "Không nhận",
  blocked: "Khóa lịch",
};

function formatTime(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function getEventColors(status: ProviderAvailabilityRule["status"]) {
  if (status === "blocked") {
    return { backgroundColor: "#fee2e2", borderColor: "#ef4444", textColor: "#991b1b" };
  }

  if (status === "unavailable") {
    return { backgroundColor: "#f1f5f9", borderColor: "#94a3b8", textColor: "#475569" };
  }

  return { backgroundColor: "#dcfce7", borderColor: "#22c55e", textColor: "#166534" };
}

function buildFormData(input: {
  intent: "save" | "update" | "delete";
  ruleId?: string;
  dayOfWeek?: number;
  startsAt?: string;
  endsAt?: string;
  capacity?: number;
  status?: ProviderAvailabilityRule["status"];
}) {
  const formData = new FormData();
  formData.set("intent", input.intent);

  if (input.ruleId) formData.set("ruleId", input.ruleId);
  if (input.dayOfWeek !== undefined) formData.set("dayOfWeek", String(input.dayOfWeek));
  if (input.startsAt) formData.set("startsAt", input.startsAt);
  if (input.endsAt) formData.set("endsAt", input.endsAt);
  if (input.capacity !== undefined) formData.set("capacity", String(input.capacity));
  if (input.status) formData.set("status", input.status);

  return formData;
}

export function ProviderAvailabilityCalendar({ rules }: ProviderAvailabilityCalendarProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [editingRule, setEditingRule] = useState<ProviderAvailabilityRule | null>(null);

  const events = useMemo<EventInput[]>(
    () =>
      rules
        .filter((rule) => rule.dayOfWeek !== null && rule.startsAt && rule.endsAt)
        .map((rule) => ({
          id: rule.id,
          title: `${STATUS_LABELS[rule.status]} • ${rule.capacity}`,
          daysOfWeek: [String(rule.dayOfWeek)],
          startTime: rule.startsAt ?? undefined,
          endTime: rule.endsAt ?? undefined,
          editable: true,
          durationEditable: true,
          extendedProps: {
            capacity: rule.capacity,
            status: rule.status,
          },
          ...getEventColors(rule.status),
        })),
    [rules]
  );

  async function submitAvailability(formData: FormData) {
    setSaving(true);
    try {
      const result = await providerApi.updateAvailability(formData);
      toast.success(result.message || "Đã cập nhật lịch.");
      router.refresh();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật lịch.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleSelect(selection: DateSelectArg) {
    const startsAt = formatTime(selection.start);
    const endsAt = formatTime(selection.end);

    if (startsAt >= endsAt) {
      toast.error("Khung giờ không hợp lệ.");
      return;
    }

    await submitAvailability(
      buildFormData({
        intent: "save",
        dayOfWeek: selection.start.getDay(),
        startsAt,
        endsAt,
        capacity: 1,
        status: "available",
      })
    );
  }

  async function updateMovedEvent(info: EventDropArg | EventResizeDoneArg) {
    const { event } = info;
    const startsAt = event.start ? formatTime(event.start) : "";
    const endsAt = event.end ? formatTime(event.end) : "";
    const status = event.extendedProps.status as ProviderAvailabilityRule["status"] | undefined;
    const capacity = Number(event.extendedProps.capacity ?? 1);

    if (!event.start || !event.end || startsAt >= endsAt || !status) {
      info.revert();
      toast.error("Khung giờ không hợp lệ.");
      return;
    }

    const saved = await submitAvailability(
      buildFormData({
        intent: "update",
        ruleId: event.id,
        dayOfWeek: event.start.getDay(),
        startsAt,
        endsAt,
        capacity,
        status,
      })
    );

    if (!saved) {
      info.revert();
    }
  }

  function handleEventClick(info: EventClickArg) {
    const rule = rules.find((item) => item.id === info.event.id);
    if (!rule) return;
    setEditingRule(rule);
  }

  async function handleEditSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingRule) return;

    const values = new FormData(event.currentTarget);
    const saved = await submitAvailability(
      buildFormData({
        intent: "update",
        ruleId: editingRule.id,
        dayOfWeek: Number(values.get("dayOfWeek") ?? editingRule.dayOfWeek ?? 0),
        startsAt: String(values.get("startsAt") ?? editingRule.startsAt ?? ""),
        endsAt: String(values.get("endsAt") ?? editingRule.endsAt ?? ""),
        capacity: Number(values.get("capacity") ?? editingRule.capacity),
        status: String(values.get("status") ?? editingRule.status) as ProviderAvailabilityRule["status"],
      })
    );

    if (saved) {
      setEditingRule(null);
    }
  }

  async function handleDeleteSelectedRule() {
    if (!editingRule) return;

    const saved = await submitAvailability(
      buildFormData({
        intent: "delete",
        ruleId: editingRule.id,
      })
    );

    if (saved) {
      setEditingRule(null);
    }
  }

  return (
    <div className="provider-availability-calendar relative min-h-[640px]">
      {saving ? (
        <div className="absolute right-3 top-3 z-10 rounded-md border bg-background px-3 py-1.5 text-xs font-medium shadow-sm">
          Đang lưu...
        </div>
      ) : null}
      <FullCalendar
        plugins={[timeGridPlugin, interactionPlugin]}
        locales={[viLocale]}
        locale="vi"
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "",
        }}
        buttonText={{ today: "Tuần này" }}
        allDaySlot={false}
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
        slotDuration="00:30:00"
        slotLabelInterval="01:00:00"
        nowIndicator
        selectable
        selectMirror
        selectMinDistance={8}
        editable
        eventStartEditable
        eventDurationEditable
        eventResizableFromStart
        events={events}
        select={handleSelect}
        eventDrop={updateMovedEvent}
        eventResize={updateMovedEvent}
        eventClick={handleEventClick}
        height="auto"
      />
      <Dialog
        open={Boolean(editingRule)}
        onOpenChange={(open) => {
          if (!open) setEditingRule(null);
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Sửa khung lịch</DialogTitle>
            <DialogDescription>Chỉnh thông tin khung lịch hoặc xóa nếu không còn nhận lịch.</DialogDescription>
          </DialogHeader>

          {editingRule ? (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ngày trong tuần</label>
                <select name="dayOfWeek" required defaultValue={editingRule.dayOfWeek ?? undefined} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                  <option value={1}>Thứ 2</option>
                  <option value={2}>Thứ 3</option>
                  <option value={3}>Thứ 4</option>
                  <option value={4}>Thứ 5</option>
                  <option value={5}>Thứ 6</option>
                  <option value={6}>Thứ 7</option>
                  <option value={0}>Chủ nhật</option>
                </select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bắt đầu</label>
                  <input name="startsAt" type="time" required defaultValue={editingRule.startsAt?.slice(0, 5)} className="h-10 w-full rounded-md border bg-background px-3 text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kết thúc</label>
                  <input name="endsAt" type="time" required defaultValue={editingRule.endsAt?.slice(0, 5)} className="h-10 w-full rounded-md border bg-background px-3 text-sm" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sức chứa</label>
                  <input name="capacity" type="number" min="1" defaultValue={editingRule.capacity} className="h-10 w-full rounded-md border bg-background px-3 text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Trạng thái</label>
                  <select name="status" defaultValue={editingRule.status} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                    <option value="available">Nhận lịch</option>
                    <option value="unavailable">Không nhận</option>
                    <option value="blocked">Khóa lịch</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Button type="button" variant="destructive" onClick={handleDeleteSelectedRule} disabled={saving}>
                  Xóa khung lịch
                </Button>
                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" onClick={() => setEditingRule(null)} disabled={saving}>
                    Hủy
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Đang lưu..." : "Cập nhật"}
                  </Button>
                </div>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
