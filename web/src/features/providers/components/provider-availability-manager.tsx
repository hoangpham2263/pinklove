"use client";

import { useState } from "react";
import { CalendarClock, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProviderDeleteButton } from "@/features/provider-orders/components/provider-buttons";
import { ProviderEmptyState, ProviderSectionCard } from "@/features/provider-orders/components/provider-page";
import type { ProviderAvailabilityRule } from "@/features/providers/server/availability";
import { providerApi } from "@/lib/api-client.provider";

type ProviderAvailabilityManagerProps = {
  rules: ProviderAvailabilityRule[];
};

const DAY_OPTIONS = [
  { value: 1, label: "Thứ 2" },
  { value: 2, label: "Thứ 3" },
  { value: 3, label: "Thứ 4" },
  { value: 4, label: "Thứ 5" },
  { value: 5, label: "Thứ 6" },
  { value: 6, label: "Thứ 7" },
  { value: 0, label: "Chủ nhật" },
];

function getStatusLabel(value: string) {
  switch (value) {
    case "blocked":
      return "Khóa lịch";
    case "unavailable":
      return "Không nhận";
    case "available":
    default:
      return "Nhận lịch";
  }
}

function getStatusClassName(value: string) {
  switch (value) {
    case "blocked":
      return "bg-red-50 text-red-700 ring-red-200";
    case "unavailable":
      return "bg-slate-100 text-slate-600 ring-slate-200";
    case "available":
    default:
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }
}

function getRuleStartValue(rule: ProviderAvailabilityRule) {
  return rule.startsAt?.slice(0, 5) ?? "99:99";
}

function buildFormData(input: {
  intent: "save" | "update" | "delete";
  ruleId?: string;
  dayOfWeek?: FormDataEntryValue | null;
  startsAt?: FormDataEntryValue | null;
  endsAt?: FormDataEntryValue | null;
  capacity?: FormDataEntryValue | null;
  status?: FormDataEntryValue | null;
}) {
  const formData = new FormData();
  formData.set("intent", input.intent);

  if (input.ruleId) formData.set("ruleId", input.ruleId);
  if (input.dayOfWeek !== undefined && input.dayOfWeek !== null) formData.set("dayOfWeek", input.dayOfWeek);
  if (input.startsAt !== undefined && input.startsAt !== null) formData.set("startsAt", input.startsAt);
  if (input.endsAt !== undefined && input.endsAt !== null) formData.set("endsAt", input.endsAt);
  if (input.capacity !== undefined && input.capacity !== null) formData.set("capacity", input.capacity);
  if (input.status !== undefined && input.status !== null) formData.set("status", input.status);

  return formData;
}

export function ProviderAvailabilityManager() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

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

  function openCreateDialog() {
    setOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const saved = await submitAvailability(
      buildFormData({
        intent: "save",
        dayOfWeek: values.get("dayOfWeek"),
        startsAt: values.get("startsAt"),
        endsAt: values.get("endsAt"),
        capacity: values.get("capacity"),
        status: values.get("status"),
      })
    );

    if (saved) {
      setOpen(false);
    }
  }

  return (
    <>
      <Button type="button" onClick={openCreateDialog}>
        <Plus className="h-4 w-4" />
        Thêm khung lịch
      </Button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Thêm khung lịch</DialogTitle>
            <DialogDescription>Chọn ngày, giờ, sức chứa và trạng thái nhận lịch.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ngày trong tuần</label>
              <select name="dayOfWeek" required className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                {DAY_OPTIONS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Bắt đầu</label>
                <input name="startsAt" type="time" required className="h-10 w-full rounded-md border bg-background px-3 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Kết thúc</label>
                <input name="endsAt" type="time" required className="h-10 w-full rounded-md border bg-background px-3 text-sm" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sức chứa</label>
                <input name="capacity" type="number" min="1" defaultValue="1" className="h-10 w-full rounded-md border bg-background px-3 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Trạng thái</label>
                <select name="status" defaultValue="available" className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                  <option value="available">Nhận lịch</option>
                  <option value="unavailable">Không nhận</option>
                  <option value="blocked">Khóa lịch</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                Hủy
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu khung lịch"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ProviderAvailabilityRulesList({ rules }: ProviderAvailabilityManagerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingRule, setEditingRule] = useState<ProviderAvailabilityRule | null>(null);

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

  function openEditDialog(rule: ProviderAvailabilityRule) {
    setEditingRule(rule);
    setOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingRule) return;

    const values = new FormData(event.currentTarget);
    const saved = await submitAvailability(
      buildFormData({
        intent: "update",
        ruleId: editingRule.id,
        dayOfWeek: values.get("dayOfWeek"),
        startsAt: values.get("startsAt"),
        endsAt: values.get("endsAt"),
        capacity: values.get("capacity"),
        status: values.get("status"),
      })
    );

    if (saved) {
      setOpen(false);
      setEditingRule(null);
    }
  }

  async function handleDelete(ruleId: string) {
    await submitAvailability(buildFormData({ intent: "delete", ruleId }));
  }

  const rulesByDay = DAY_OPTIONS.map((day) => ({
    ...day,
    rules: rules
      .filter((rule) => rule.dayOfWeek === day.value)
      .slice()
      .sort((left, right) => getRuleStartValue(left).localeCompare(getRuleStartValue(right))),
  }));

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) setEditingRule(null);
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Sửa khung lịch</DialogTitle>
            <DialogDescription>Chỉnh ngày, giờ, sức chứa và trạng thái nhận lịch.</DialogDescription>
          </DialogHeader>

          {editingRule ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ngày trong tuần</label>
                <select name="dayOfWeek" required defaultValue={editingRule.dayOfWeek ?? undefined} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                  {DAY_OPTIONS.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
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
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                  Hủy
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Đang lưu..." : "Cập nhật khung lịch"}
                </Button>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <ProviderSectionCard
        title={<span className="flex items-center gap-2"><CalendarClock className="h-4 w-4" /> Lịch đã khai báo</span>}
        contentClassName="pt-0"
      >
        {rules.length === 0 ? (
          <ProviderEmptyState>Chưa có khung lịch nào.</ProviderEmptyState>
        ) : (
          <div className="divide-y">
            {rulesByDay.map((day) => (
              <div key={day.value} className="grid gap-3 py-4 first:pt-0 last:pb-0 lg:grid-cols-[120px_1fr]">
                <div className="flex items-start justify-between gap-3 lg:block">
                  <p className="font-semibold">{day.label}</p>
                  <p className="text-sm text-muted-foreground">{day.rules.length} khung</p>
                </div>
                {day.rules.length === 0 ? (
                  <p className="py-1 text-sm text-muted-foreground">Chưa khai báo lịch.</p>
                ) : (
                  <div className="space-y-2">
                    {day.rules.map((rule) => (
                      <div key={rule.id} className="grid gap-3 rounded-md bg-muted/30 px-3 py-2 md:grid-cols-[150px_1fr_auto] md:items-center">
                        <div className="font-medium">
                          {rule.startsAt?.slice(0, 5)} - {rule.endsAt?.slice(0, 5)}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <span className={`inline-flex h-6 items-center rounded-full px-2 text-xs font-medium ring-1 ${getStatusClassName(rule.status)}`}>
                            {getStatusLabel(rule.status)}
                          </span>
                          <span>Sức chứa {rule.capacity}</span>
                          {rule.calendarLabel ? <span>{rule.calendarLabel}</span> : null}
                        </div>
                        <div className="flex justify-start gap-2 md:justify-end">
                          <Button type="button" variant="outline" onClick={() => openEditDialog(rule)}>
                            Sửa
                          </Button>
                          <ProviderDeleteButton type="button" onClick={() => handleDelete(rule.id)} disabled={saving}>
                            Xóa
                          </ProviderDeleteButton>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ProviderSectionCard>
    </>
  );
}
