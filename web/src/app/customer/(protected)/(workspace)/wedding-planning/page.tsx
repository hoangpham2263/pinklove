import type { ReactNode } from "react";
import { CalendarDays, CheckSquare2, ChevronDown, ClipboardCheck, Images, Settings2, Table2, Users } from "lucide-react";

import { NativeForm } from "@/components/common/native-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerSubmitButton } from "@/features/customer/ui/customer-buttons";
import { CustomerField, CustomerInput, CustomerSelect, CustomerTextarea } from "@/features/customer/ui/customer-form";
import { MediaCollectionsManager } from "@/features/media/components/media-collections-manager";
import { listMediaCollections } from "@/features/media/server/media-collections";
import {
  WEDDING_TASK_CATEGORIES,
  WEDDING_TASK_STATUSES,
  WEDDING_TIMELINE_TYPES,
  getWeddingPlanningWorkspace,
} from "@/features/wedding-planning/server/service";
import { requireAppUser } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

type PlanningPageProps = {
  searchParams: Promise<{ site?: string }>;
};

const formClass = "grid gap-3";

function MetricCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-md border bg-background p-4">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function PlanningPanel({
  title,
  summary,
  icon,
  count,
  defaultOpen = false,
  children,
}: {
  title: string;
  summary: string;
  icon: ReactNode;
  count?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden rounded-lg">
      <details open={defaultOpen} className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 border-b px-5 py-4 [&::-webkit-details-marker]:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-muted/40 text-muted-foreground">
              {icon}
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate text-base">{title}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{summary}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {count ? <span className="rounded-full border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground">{count}</span> : null}
            <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
          </div>
        </summary>
        <CardContent className="space-y-5 p-5 md:p-6">{children}</CardContent>
      </details>
    </Card>
  );
}

export default async function WeddingPlanningPage({ searchParams }: PlanningPageProps) {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const params = await searchParams;
  const workspace = await getWeddingPlanningWorkspace(user.id, params.site);
  const site = workspace.activeSite;
  const collections = site ? await listMediaCollections("wedding_site", site.id) : [];
  const acceptedRsvps = workspace.rsvps.filter((rsvp) => rsvp.response_status === "accepted").length;
  const openTasks = workspace.tasks.filter((task) => !["done", "completed"].includes(task.status)).length;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Kế hoạch cưới</h1>
          <p className="mt-1 text-sm text-muted-foreground">Khách mời, RSVP, bàn tiệc, checklist và timeline theo từng wedding site.</p>
        </div>
        {workspace.sites.length > 0 ? (
          <NativeForm method="GET" className="grid w-full gap-2 sm:w-auto sm:grid-cols-[minmax(240px,1fr)_auto]">
            <CustomerSelect name="site" defaultValue={site?.id}>
              {workspace.sites.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </CustomerSelect>
            <CustomerSubmitButton>Mở</CustomerSubmitButton>
          </NativeForm>
        ) : null}
      </div>

      {!site ? (
        <div className="rounded-md border border-dashed bg-background p-8 text-sm text-muted-foreground">
          Tạo wedding site hoặc thiệp trước để bắt đầu kế hoạch cưới.
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Khách mời" value={workspace.guests.length} hint={`Mục tiêu ${site.guest_target || 0}`} />
            <MetricCard label="RSVP tham dự" value={acceptedRsvps} hint={`${workspace.rsvps.length} phản hồi`} />
            <MetricCard label="Bàn tiệc" value={workspace.tables.length} hint="Đã tạo trong sơ đồ bàn" />
            <MetricCard label="Việc cần xử lý" value={openTasks} hint={`${workspace.tasks.length} checklist`} />
            <MetricCard label="Timeline" value={workspace.timeline.length} hint="Mốc chương trình" />
          </div>

          <div className="grid gap-4">
            <PlanningPanel
              title="Thông tin kế hoạch"
              summary="Trạng thái, ngân sách, ngày cưới và mục tiêu khách."
              icon={<Settings2 className="size-4" />}
              defaultOpen
            >
              <NativeForm action={ROUTES.API.CUSTOMER.WEDDING_PLANNING} method="POST" className={formClass}>
                <input type="hidden" name="intent" value="update_project" />
                <input type="hidden" name="weddingSiteId" value={site.id} />
                <CustomerField label="Trạng thái"><CustomerSelect name="projectStatus" defaultValue={site.project_status}><option value="draft">Draft</option><option value="active">Active</option><option value="completed">Completed</option><option value="archived">Archived</option></CustomerSelect></CustomerField>
                <CustomerField label="Ngân sách"><CustomerInput name="budget" type="number" min="0" defaultValue={site.budget} /></CustomerField>
                <CustomerField label="Ngày cưới"><CustomerInput name="eventDate" type="date" defaultValue={site.event_date ?? ""} /></CustomerField>
                <CustomerField label="Mục tiêu khách"><CustomerInput name="guestTarget" type="number" min="0" defaultValue={site.guest_target} /></CustomerField>
                <CustomerSubmitButton>Lưu kế hoạch</CustomerSubmitButton>
              </NativeForm>
            </PlanningPanel>

            <PlanningPanel
              title="Albums / Galleries"
              summary="Tải và sắp xếp ảnh pre-wedding, lễ cưới hoặc tiệc cưới."
              icon={<Images className="size-4" />}
              count={`${collections.length} album`}
            >
              <MediaCollectionsManager
                collections={collections}
                targets={[{ type: "wedding_site", id: site.id, label: site.title }]}
                targetType="wedding_site"
                targetId={site.id}
                title="Albums / Galleries"
                summary="Tải và sắp xếp ảnh pre-wedding, ảnh lễ cưới hoặc ảnh tiệc cưới cho wedding site này."
              />
            </PlanningPanel>

            <PlanningPanel
              title="Khách mời"
              summary="Tạo nhóm, thêm khách và kiểm tra danh sách theo nhóm."
              icon={<Users className="size-4" />}
              count={`${workspace.guests.length} khách`}
            >
                <NativeForm action={ROUTES.API.CUSTOMER.WEDDING_PLANNING} method="POST" className={formClass}>
                  <input type="hidden" name="intent" value="create_group" /><input type="hidden" name="weddingSiteId" value={site.id} />
                  <CustomerInput name="name" placeholder="Tên nhóm: Nhà trai, Bạn bè..." required /><CustomerSubmitButton>Thêm nhóm</CustomerSubmitButton>
                </NativeForm>
                <NativeForm action={ROUTES.API.CUSTOMER.WEDDING_PLANNING} method="POST" className={formClass}>
                  <input type="hidden" name="intent" value="create_guest" /><input type="hidden" name="weddingSiteId" value={site.id} />
                  <CustomerInput name="fullName" placeholder="Tên khách mời" required /><CustomerInput name="phone" placeholder="Số điện thoại" />
                  <CustomerInput name="email" type="email" placeholder="Email" />
                  <CustomerSelect name="guestGroupId"><option value="">Không có nhóm</option>{workspace.groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</CustomerSelect>
                  <CustomerInput name="note" placeholder="Ghi chú" />
                  <CustomerSubmitButton>Thêm khách</CustomerSubmitButton>
                </NativeForm>
                <div className="divide-y rounded-md border">
                  {workspace.guests.map((guest) => <div key={guest.id} className="flex justify-between gap-3 p-3 text-sm"><span className="font-medium">{guest.full_name}</span><span className="text-muted-foreground">{guest.group_label || "Chưa phân nhóm"}</span></div>)}
                  {workspace.guests.length === 0 ? <p className="p-4 text-sm text-muted-foreground">Chưa có khách mời.</p> : null}
                </div>
            </PlanningPanel>

            <PlanningPanel
              title="RSVP"
              summary="Lưu phản hồi tham dự, số lượng người đi cùng và yêu cầu đặc biệt."
              icon={<ClipboardCheck className="size-4" />}
              count={`${workspace.rsvps.length} phản hồi`}
            >
                <NativeForm action={ROUTES.API.CUSTOMER.WEDDING_PLANNING} method="POST" className={formClass}>
                  <input type="hidden" name="intent" value="save_rsvp" /><input type="hidden" name="weddingSiteId" value={site.id} />
                  <CustomerSelect name="guestId">
                    <option value="">Không liên kết khách mời</option>
                    {workspace.guests.map((guest) => <option key={guest.id} value={guest.id}>{guest.full_name}</option>)}
                  </CustomerSelect>
                  <CustomerInput name="attendeeName" placeholder="Tên người phản hồi" required />
                  <CustomerInput name="attendeeCount" type="number" min="1" defaultValue="1" />
                  <CustomerSelect name="responseStatus"><option value="accepted">Tham dự</option><option value="declined">Không tham dự</option><option value="pending">Chưa xác nhận</option></CustomerSelect>
                  <CustomerInput name="mealChoice" placeholder="Lựa chọn món ăn" />
                  <CustomerInput name="specialRequests" placeholder="Yêu cầu đặc biệt" />
                  <CustomerSubmitButton>Lưu RSVP</CustomerSubmitButton>
                </NativeForm>
                <div className="divide-y rounded-md border">
                  {workspace.rsvps.map((rsvp) => <div key={rsvp.id} className="flex justify-between gap-3 p-3 text-sm"><span className="font-medium">{rsvp.attendee_name}</span><span className="text-muted-foreground">{rsvp.response_status} · {rsvp.attendee_count} người</span></div>)}
                  {workspace.rsvps.length === 0 ? <p className="p-4 text-sm text-muted-foreground">Chưa có phản hồi RSVP.</p> : null}
                </div>
            </PlanningPanel>

            <PlanningPanel
              title="Bàn tiệc"
              summary="Tạo bàn, đặt sức chứa và xếp khách vào bàn."
              icon={<Table2 className="size-4" />}
              count={`${workspace.tables.length} bàn`}
            >
                <NativeForm action={ROUTES.API.CUSTOMER.WEDDING_PLANNING} method="POST" className={formClass}>
                  <input type="hidden" name="intent" value="create_table" /><input type="hidden" name="weddingSiteId" value={site.id} />
                  <CustomerInput name="name" placeholder="Tên bàn" required /><CustomerInput name="capacity" type="number" min="0" placeholder="Sức chứa" />
                  <CustomerInput name="notes" placeholder="Ghi chú" />
                  <CustomerSubmitButton>Thêm bàn</CustomerSubmitButton>
                </NativeForm>
                <NativeForm action={ROUTES.API.CUSTOMER.WEDDING_PLANNING} method="POST" className={formClass}>
                  <input type="hidden" name="intent" value="assign_guest" /><input type="hidden" name="weddingSiteId" value={site.id} />
                  <CustomerSelect name="tableId" required><option value="">Chọn bàn</option>{workspace.tables.map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}</CustomerSelect>
                  <CustomerSelect name="guestId" required><option value="">Chọn khách</option>{workspace.guests.map((guest) => <option key={guest.id} value={guest.id}>{guest.full_name}</option>)}</CustomerSelect>
                  <CustomerInput name="seatNumber" placeholder="Số ghế" />
                  <CustomerSubmitButton>Xếp chỗ</CustomerSubmitButton>
                </NativeForm>
                <div className="divide-y rounded-md border">{workspace.tables.map((table) => <div key={table.id} className="flex justify-between p-3 text-sm"><span className="font-medium">{table.name}</span><span className="text-muted-foreground">{table.assigned_guests}/{table.capacity}</span></div>)}</div>
            </PlanningPanel>

            <PlanningPanel
              title="Checklist"
              summary="Quản lý công việc theo hạng mục, trạng thái, ưu tiên và hạn xử lý."
              icon={<CheckSquare2 className="size-4" />}
              count={`${openTasks} việc mở`}
            >
                <NativeForm action={ROUTES.API.CUSTOMER.WEDDING_PLANNING} method="POST" className={formClass}>
                  <input type="hidden" name="intent" value="create_task" /><input type="hidden" name="weddingSiteId" value={site.id} />
                  <CustomerInput name="title" placeholder="Tên công việc" required />
                  <CustomerSelect name="category">{WEDDING_TASK_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</CustomerSelect>
                  <CustomerSelect name="status">{WEDDING_TASK_STATUSES.map((item) => <option key={item}>{item}</option>)}</CustomerSelect>
                  <CustomerInput name="priority" placeholder="Mức ưu tiên" defaultValue="normal" />
                  <CustomerInput name="dueDate" type="date" /><CustomerTextarea name="description" className="min-h-20" placeholder="Mô tả" />
                  <CustomerSubmitButton>Thêm công việc</CustomerSubmitButton>
                </NativeForm>
                <div className="divide-y rounded-md border">{workspace.tasks.map((task) => <div key={task.id} className="p-3 text-sm"><div className="flex justify-between gap-3"><span className="font-medium">{task.title}</span><span className="text-muted-foreground">{task.status}</span></div><p className="mt-1 text-xs text-muted-foreground">{task.category}{task.due_date ? ` · ${task.due_date}` : ""}</p></div>)}</div>
            </PlanningPanel>

            <PlanningPanel
              title="Timeline"
              summary="Lên lịch hoạt động cho lễ, tiệc, chụp ảnh và các mốc chuẩn bị."
              icon={<CalendarDays className="size-4" />}
              count={`${workspace.timeline.length} mốc`}
            >
                <NativeForm action={ROUTES.API.CUSTOMER.WEDDING_PLANNING} method="POST" className={formClass}>
                  <input type="hidden" name="intent" value="create_timeline" /><input type="hidden" name="weddingSiteId" value={site.id} />
                  <CustomerInput name="title" placeholder="Tên hoạt động" required />
                  <CustomerSelect name="timelineType">{WEDDING_TIMELINE_TYPES.map((item) => <option key={item}>{item}</option>)}</CustomerSelect>
                  <CustomerField label="Bắt đầu"><CustomerInput name="startsAt" type="datetime-local" /></CustomerField>
                  <CustomerField label="Kết thúc"><CustomerInput name="endsAt" type="datetime-local" /></CustomerField>
                  <CustomerTextarea name="notes" className="min-h-20" placeholder="Ghi chú" />
                  <CustomerSubmitButton>Thêm timeline</CustomerSubmitButton>
                </NativeForm>
                <div className="divide-y rounded-md border">{workspace.timeline.map((item) => <div key={item.id} className="p-3 text-sm"><div className="flex justify-between gap-3"><span className="font-medium">{item.title}</span><span className="text-muted-foreground">{item.timeline_type}</span></div><p className="mt-1 text-xs text-muted-foreground">{item.starts_at || "Chưa đặt thời gian"}</p></div>)}</div>
            </PlanningPanel>
          </div>
        </>
      )}
    </section>
  );
}
