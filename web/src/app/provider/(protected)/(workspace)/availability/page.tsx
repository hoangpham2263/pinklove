import { CalendarClock } from "lucide-react";

import { NativeForm } from "@/components/common/native-form";
import { ProviderDeleteButton, ProviderSubmitButton } from "@/features/provider-orders/components/provider-buttons";
import { ProviderOverviewCard, ProviderOverviewGrid } from "@/features/provider-orders/components/provider-overview-card";
import { ProviderEmptyState, ProviderPage, ProviderPageHeader, ProviderSectionCard } from "@/features/provider-orders/components/provider-page";
import { listProviderAvailabilityRules } from "@/features/providers/server/availability";
import { getProviderByUserId } from "@/features/providers/server/service";
import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

const DAY_OPTIONS = [
  { value: 1, label: "Thứ 2" },
  { value: 2, label: "Thứ 3" },
  { value: 3, label: "Thứ 4" },
  { value: 4, label: "Thứ 5" },
  { value: 5, label: "Thứ 6" },
  { value: 6, label: "Thứ 7" },
  { value: 0, label: "Chủ nhật" },
];

function getDayLabel(value: number | null) {
  return DAY_OPTIONS.find((item) => item.value === value)?.label ?? "-";
}

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

function getProviderTypeLabel(value: string) {
  switch (value) {
    case "makeup":
      return "Makeup";
    case "photographer":
      return "Photographer";
    case "planner":
      return "Planner";
    case "studio":
      return "Studio";
    case "florist":
      return "Florist";
    case "videographer":
      return "Videographer";
    case "creator":
      return "Creator";
    case "supplier":
    default:
      return "Supplier";
  }
}

export default async function ProviderAvailabilityPage({ searchParams }: { searchParams?: Promise<{ editRuleId?: string }> }) {
  const providerUser = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const provider = await getProviderByUserId(providerUser.id);
  const rules = provider ? await listProviderAvailabilityRules(provider.id) : [];
  const activeRules = rules.filter((rule) => rule.status === "available").length;
  
  const query = searchParams ? await searchParams : {};
  const editingRule = rules.find((rule) => rule.id === query.editRuleId) || null;

  return (
    <ProviderPage>
      <ProviderPageHeader
        eyebrow={provider ? getProviderTypeLabel(provider.provider_type) : "Provider"}
        title="Lịch khả dụng"
        description="Provider tự khai báo khung giờ nhận lịch. Website sẽ dùng dữ liệu này để biết provider nào còn trống theo từng loại dịch vụ."
      />

      <ProviderOverviewGrid>
        <ProviderOverviewCard title="Khung lịch" value={rules.length} />
        <ProviderOverviewCard title="Đang nhận" value={activeRules} />
        <ProviderOverviewCard title="Loại provider" value={provider ? getProviderTypeLabel(provider.provider_type) : "-"} />
        <ProviderOverviewCard title="Quản lý" value="Tự động" description="Admin chỉ xem khi cần kiểm tra" />
      </ProviderOverviewGrid>

      {!provider ? (
        <ProviderEmptyState>Chưa có hồ sơ provider để cấu hình lịch.</ProviderEmptyState>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <ProviderSectionCard title={editingRule ? "Sửa khung lịch" : "Thêm khung lịch"} description="Nhập lịch lặp theo tuần. Có thể thêm nhiều khung cho cùng một ngày.">
            <NativeForm action={ROUTES.API.PROVIDER.AVAILABILITY} method="POST" className="space-y-4">
              <input type="hidden" name="intent" value={editingRule ? "update" : "save"} />
              {editingRule ? <input type="hidden" name="ruleId" value={editingRule.id} /> : null}
              <div className="space-y-2">
                <label className="text-sm font-medium">Ngày trong tuần</label>
                <select name="dayOfWeek" required defaultValue={editingRule?.dayOfWeek ?? undefined} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
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
                  <input name="startsAt" type="time" required defaultValue={editingRule?.startsAt?.slice(0, 5)} className="h-10 w-full rounded-md border bg-background px-3 text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kết thúc</label>
                  <input name="endsAt" type="time" required defaultValue={editingRule?.endsAt?.slice(0, 5)} className="h-10 w-full rounded-md border bg-background px-3 text-sm" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sức chứa</label>
                  <input name="capacity" type="number" min="1" defaultValue={editingRule?.capacity ?? "1"} className="h-10 w-full rounded-md border bg-background px-3 text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Trạng thái</label>
                  <select name="status" defaultValue={editingRule?.status ?? "available"} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                    <option value="available">Nhận lịch</option>
                    <option value="unavailable">Không nhận</option>
                    <option value="blocked">Khóa lịch</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ProviderSubmitButton type="submit" className={editingRule ? "flex-1" : "w-full"}>
                  {editingRule ? "Cập nhật khung lịch" : "Lưu khung lịch"}
                </ProviderSubmitButton>
                {editingRule ? (
                  <a href={ROUTES.PROVIDER.AVAILABILITY} className="inline-flex h-10 items-center justify-center rounded-md border bg-background px-4 text-sm font-medium hover:bg-muted">
                    Hủy
                  </a>
                ) : null}
              </div>
            </NativeForm>
          </ProviderSectionCard>

          <ProviderSectionCard title={<span className="flex items-center gap-2"><CalendarClock className="h-4 w-4" /> Lịch đã khai báo</span>}>
            {rules.length === 0 ? (
              <ProviderEmptyState>Chưa có khung lịch nào.</ProviderEmptyState>
            ) : (
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div key={rule.id} className="grid gap-3 rounded-md border p-4 md:grid-cols-[1fr_140px_120px] md:items-center">
                    <div className="space-y-1">
                      <p className="font-medium">
                        {getDayLabel(rule.dayOfWeek)} • {rule.startsAt?.slice(0, 5)} - {rule.endsAt?.slice(0, 5)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {rule.calendarLabel || "Default"} • Sức chứa {rule.capacity}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">{getStatusLabel(rule.status)}</p>
                    <div className="flex justify-start md:justify-end gap-2">
                      <a href={`${ROUTES.PROVIDER.AVAILABILITY}?editRuleId=${rule.id}`} className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted">
                        Sửa
                      </a>
                      <NativeForm action={ROUTES.API.PROVIDER.AVAILABILITY} method="POST">
                        <input type="hidden" name="intent" value="delete" />
                        <input type="hidden" name="ruleId" value={rule.id} />
                        <ProviderDeleteButton type="submit">Xóa</ProviderDeleteButton>
                      </NativeForm>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ProviderSectionCard>
        </div>
      )}
    </ProviderPage>
  );
}
