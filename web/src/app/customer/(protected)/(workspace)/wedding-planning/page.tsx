import { CalendarDays, CheckSquare2, ClipboardCheck, Table2, Users } from "lucide-react";

import { NativeForm } from "@/components/common/native-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

const inputClass = "h-9 w-full rounded-md border bg-background px-3 text-sm";
const textareaClass = "min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm";
const buttonClass = "inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground";

export default async function WeddingPlanningPage({ searchParams }: PlanningPageProps) {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const params = await searchParams;
  const workspace = await getWeddingPlanningWorkspace(user.id, params.site);
  const site = workspace.activeSite;
  const collections = site ? await listMediaCollections("wedding_site", site.id) : [];

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Kế hoạch cưới</h1>
          <p className="mt-1 text-sm text-muted-foreground">Khách mời, RSVP, bàn tiệc, checklist và timeline theo từng wedding site.</p>
        </div>
        {workspace.sites.length > 0 ? (
          <NativeForm method="GET" className="flex items-center gap-2">
            <select name="site" defaultValue={site?.id} className={inputClass}>
              {workspace.sites.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
            <button className={buttonClass}>Mở</button>
          </NativeForm>
        ) : null}
      </div>

      {!site ? (
        <div className="rounded-md border border-dashed bg-background p-8 text-sm text-muted-foreground">
          Tạo wedding site hoặc thiệp trước để bắt đầu kế hoạch cưới.
        </div>
      ) : (
        <>
          <MediaCollectionsManager
            collections={collections}
            targets={site ? [{ type: "wedding_site", id: site.id, label: site.title }] : []}
            targetType="wedding_site"
            targetId={site.id}
            title="Albums / Galleries"
            summary="Tải và sắp xếp ảnh pre-wedding, ảnh lễ cưới hoặc ảnh tiệc cưới cho wedding site này."
          />

          <Card>
            <CardHeader><CardTitle className="text-base">Thông tin kế hoạch</CardTitle></CardHeader>
            <CardContent>
              <NativeForm action={ROUTES.API.CUSTOMER.WEDDING_PLANNING} method="POST" className="grid gap-4 md:grid-cols-4">
                <input type="hidden" name="intent" value="update_project" />
                <input type="hidden" name="weddingSiteId" value={site.id} />
                <label className="space-y-2 text-sm"><span>Trạng thái</span><select name="projectStatus" defaultValue={site.project_status} className={inputClass}><option value="draft">Draft</option><option value="active">Active</option><option value="completed">Completed</option><option value="archived">Archived</option></select></label>
                <label className="space-y-2 text-sm"><span>Ngân sách</span><Input name="budget" type="number" min="0" defaultValue={site.budget} /></label>
                <label className="space-y-2 text-sm"><span>Ngày cưới</span><Input name="eventDate" type="date" defaultValue={site.event_date ?? ""} /></label>
                <label className="space-y-2 text-sm"><span>Mục tiêu khách</span><Input name="guestTarget" type="number" min="0" defaultValue={site.guest_target} /></label>
                <div className="md:col-span-4"><button className={buttonClass}>Lưu kế hoạch</button></div>
              </NativeForm>
            </CardContent>
          </Card>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Users className="size-4" />Khách mời</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <NativeForm action={ROUTES.API.CUSTOMER.WEDDING_PLANNING} method="POST" className="flex gap-2">
                  <input type="hidden" name="intent" value="create_group" /><input type="hidden" name="weddingSiteId" value={site.id} />
                  <Input name="name" placeholder="Tên nhóm: Nhà trai, Bạn bè..." required /><button className={buttonClass}>Thêm nhóm</button>
                </NativeForm>
                <NativeForm action={ROUTES.API.CUSTOMER.WEDDING_PLANNING} method="POST" className="grid gap-3 md:grid-cols-2">
                  <input type="hidden" name="intent" value="create_guest" /><input type="hidden" name="weddingSiteId" value={site.id} />
                  <Input name="fullName" placeholder="Tên khách mời" required /><Input name="phone" placeholder="Số điện thoại" />
                  <Input name="email" type="email" placeholder="Email" />
                  <select name="guestGroupId" className={inputClass}><option value="">Không có nhóm</option>{workspace.groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select>
                  <Input name="note" placeholder="Ghi chú" className="md:col-span-2" />
                  <div className="md:col-span-2"><button className={buttonClass}>Thêm khách</button></div>
                </NativeForm>
                <div className="divide-y rounded-md border">
                  {workspace.guests.map((guest) => <div key={guest.id} className="flex justify-between gap-3 p-3 text-sm"><span className="font-medium">{guest.full_name}</span><span className="text-muted-foreground">{guest.group_label || "Chưa phân nhóm"}</span></div>)}
                  {workspace.guests.length === 0 ? <p className="p-4 text-sm text-muted-foreground">Chưa có khách mời.</p> : null}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ClipboardCheck className="size-4" />RSVP</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <NativeForm action={ROUTES.API.CUSTOMER.WEDDING_PLANNING} method="POST" className="grid gap-3 md:grid-cols-2">
                  <input type="hidden" name="intent" value="save_rsvp" /><input type="hidden" name="weddingSiteId" value={site.id} />
                  <select name="guestId" className={inputClass}>
                    <option value="">Không liên kết khách mời</option>
                    {workspace.guests.map((guest) => <option key={guest.id} value={guest.id}>{guest.full_name}</option>)}
                  </select>
                  <Input name="attendeeName" placeholder="Tên người phản hồi" required />
                  <Input name="attendeeCount" type="number" min="1" defaultValue="1" />
                  <select name="responseStatus" className={inputClass}><option value="accepted">Tham dự</option><option value="declined">Không tham dự</option><option value="pending">Chưa xác nhận</option></select>
                  <Input name="mealChoice" placeholder="Lựa chọn món ăn" />
                  <Input name="specialRequests" placeholder="Yêu cầu đặc biệt" />
                  <div className="md:col-span-2"><button className={buttonClass}>Lưu RSVP</button></div>
                </NativeForm>
                <div className="divide-y rounded-md border">
                  {workspace.rsvps.map((rsvp) => <div key={rsvp.id} className="flex justify-between gap-3 p-3 text-sm"><span className="font-medium">{rsvp.attendee_name}</span><span className="text-muted-foreground">{rsvp.response_status} · {rsvp.attendee_count} người</span></div>)}
                  {workspace.rsvps.length === 0 ? <p className="p-4 text-sm text-muted-foreground">Chưa có phản hồi RSVP.</p> : null}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Table2 className="size-4" />Bàn tiệc</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <NativeForm action={ROUTES.API.CUSTOMER.WEDDING_PLANNING} method="POST" className="grid gap-3 md:grid-cols-2">
                  <input type="hidden" name="intent" value="create_table" /><input type="hidden" name="weddingSiteId" value={site.id} />
                  <Input name="name" placeholder="Tên bàn" required /><Input name="capacity" type="number" min="0" placeholder="Sức chứa" />
                  <Input name="notes" placeholder="Ghi chú" className="md:col-span-2" />
                  <div className="md:col-span-2"><button className={buttonClass}>Thêm bàn</button></div>
                </NativeForm>
                <NativeForm action={ROUTES.API.CUSTOMER.WEDDING_PLANNING} method="POST" className="grid gap-3 md:grid-cols-3">
                  <input type="hidden" name="intent" value="assign_guest" /><input type="hidden" name="weddingSiteId" value={site.id} />
                  <select name="tableId" className={inputClass} required><option value="">Chọn bàn</option>{workspace.tables.map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}</select>
                  <select name="guestId" className={inputClass} required><option value="">Chọn khách</option>{workspace.guests.map((guest) => <option key={guest.id} value={guest.id}>{guest.full_name}</option>)}</select>
                  <Input name="seatNumber" placeholder="Số ghế" />
                  <div className="md:col-span-3"><button className={buttonClass}>Xếp chỗ</button></div>
                </NativeForm>
                <div className="divide-y rounded-md border">{workspace.tables.map((table) => <div key={table.id} className="flex justify-between p-3 text-sm"><span className="font-medium">{table.name}</span><span className="text-muted-foreground">{table.assigned_guests}/{table.capacity}</span></div>)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CheckSquare2 className="size-4" />Checklist</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <NativeForm action={ROUTES.API.CUSTOMER.WEDDING_PLANNING} method="POST" className="grid gap-3 md:grid-cols-2">
                  <input type="hidden" name="intent" value="create_task" /><input type="hidden" name="weddingSiteId" value={site.id} />
                  <Input name="title" placeholder="Tên công việc" required />
                  <select name="category" className={inputClass}>{WEDDING_TASK_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select>
                  <select name="status" className={inputClass}>{WEDDING_TASK_STATUSES.map((item) => <option key={item}>{item}</option>)}</select>
                  <Input name="priority" placeholder="Mức ưu tiên" defaultValue="normal" />
                  <Input name="dueDate" type="date" /><textarea name="description" className={textareaClass} placeholder="Mô tả" />
                  <div className="md:col-span-2"><button className={buttonClass}>Thêm công việc</button></div>
                </NativeForm>
                <div className="divide-y rounded-md border">{workspace.tasks.map((task) => <div key={task.id} className="p-3 text-sm"><div className="flex justify-between gap-3"><span className="font-medium">{task.title}</span><span className="text-muted-foreground">{task.status}</span></div><p className="mt-1 text-xs text-muted-foreground">{task.category}{task.due_date ? ` · ${task.due_date}` : ""}</p></div>)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CalendarDays className="size-4" />Timeline</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <NativeForm action={ROUTES.API.CUSTOMER.WEDDING_PLANNING} method="POST" className="grid gap-3 md:grid-cols-2">
                  <input type="hidden" name="intent" value="create_timeline" /><input type="hidden" name="weddingSiteId" value={site.id} />
                  <Input name="title" placeholder="Tên hoạt động" required />
                  <select name="timelineType" className={inputClass}>{WEDDING_TIMELINE_TYPES.map((item) => <option key={item}>{item}</option>)}</select>
                  <label className="space-y-1 text-sm"><span>Bắt đầu</span><Input name="startsAt" type="datetime-local" /></label>
                  <label className="space-y-1 text-sm"><span>Kết thúc</span><Input name="endsAt" type="datetime-local" /></label>
                  <textarea name="notes" className={`${textareaClass} md:col-span-2`} placeholder="Ghi chú" />
                  <div className="md:col-span-2"><button className={buttonClass}>Thêm timeline</button></div>
                </NativeForm>
                <div className="divide-y rounded-md border">{workspace.timeline.map((item) => <div key={item.id} className="p-3 text-sm"><div className="flex justify-between gap-3"><span className="font-medium">{item.title}</span><span className="text-muted-foreground">{item.timeline_type}</span></div><p className="mt-1 text-xs text-muted-foreground">{item.starts_at || "Chưa đặt thời gian"}</p></div>)}</div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </section>
  );
}
