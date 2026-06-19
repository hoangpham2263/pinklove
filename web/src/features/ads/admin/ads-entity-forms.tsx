import { NativeForm } from "@/components/common/native-form";
import { AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { AdminField, AdminInput, AdminSelect, AdminTextarea } from "@/features/admin/components/admin-form";
import { ROUTES } from "@/lib/routes";

type Option = { id: string; label: string };
type TargetUrlOption = { href: string; label: string };
type Row = Record<string, unknown>;

function text(row: Row | null | undefined, key: string) {
  const value = row?.[key];
  return typeof value === "string" ? value : value === null || value === undefined ? "" : String(value);
}

function bool(row: Row | null | undefined, key: string, fallback = false) {
  const value = row?.[key];
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true";
  return fallback;
}

function metadata(row: Row | null | undefined) {
  const value = row?.metadata;
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function listValue(value: unknown) {
  if (Array.isArray(value)) return value.map(String).join("\n");
  if (typeof value === "string") return value;
  return "";
}

function FormIdentity({ row }: { row?: Row | null }) {
  return (
    <>
      <input type="hidden" name="intent" value={row ? "update" : "create"} />
      {row ? <input type="hidden" name="id" value={text(row, "id")} /> : null}
    </>
  );
}

function TargetUrlSelect({
  value,
  options,
}: {
  value: string;
  options: TargetUrlOption[];
}) {
  const hasCurrentValue = value && options.some((option) => option.href === value);
  return (
    <AdminSelect name="targetUrl" defaultValue={value}>
      <option value="">Không gắn link</option>
      {!hasCurrentValue && value ? <option value={value}>{value}</option> : null}
      {options.map((option) => (
        <option key={option.href} value={option.href}>{option.label} - {option.href}</option>
      ))}
    </AdminSelect>
  );
}

export function AdvertiserForm({ row }: { row?: Row | null }) {
  return (
    <NativeForm action={ROUTES.API.ADMIN.MARKETING.ADS.ADVERTISERS} method="POST" className="grid gap-4 md:grid-cols-3">
      <FormIdentity row={row} />
      <AdminField label="Tên advertiser" required><AdminInput name="name" defaultValue={text(row, "name")} required /></AdminField>
      <AdminField label="Người liên hệ"><AdminInput name="contactName" defaultValue={text(row, "contact_name")} /></AdminField>
      <AdminField label="Email"><AdminInput name="contactEmail" type="email" defaultValue={text(row, "contact_email")} /></AdminField>
      <AdminField label="Phone"><AdminInput name="contactPhone" defaultValue={text(row, "contact_phone")} /></AdminField>
      <AdminField label="Website"><AdminInput name="websiteUrl" defaultValue={text(row, "website_url")} /></AdminField>
      <AdminField label="Status"><AdminSelect name="status" defaultValue={text(row, "status") || "active"}><option value="active">active</option><option value="inactive">inactive</option><option value="archived">archived</option></AdminSelect></AdminField>
      <AdminField label="Ghi chú" className="md:col-span-3"><AdminTextarea name="notes" rows={3} defaultValue={text(row, "notes")} /></AdminField>
      <div className="md:col-span-3"><AdminSubmitButton>{row ? "Lưu advertiser" : "Tạo advertiser"}</AdminSubmitButton></div>
    </NativeForm>
  );
}

export function PlacementForm({ row }: { row?: Row | null }) {
  const meta = metadata(row);
  const pageRules = meta.pageRules && typeof meta.pageRules === "object" && !Array.isArray(meta.pageRules) ? meta.pageRules as Record<string, unknown> : {};
  return (
    <NativeForm action={ROUTES.API.ADMIN.MARKETING.ADS.PLACEMENTS} method="POST" className="grid gap-4 md:grid-cols-3">
      <FormIdentity row={row} />
      <AdminField label="Key" required><AdminInput name="key" defaultValue={text(row, "key")} placeholder="targeted_popup" required /></AdminField>
      <AdminField label="Tên placement" required><AdminInput name="label" defaultValue={text(row, "label")} required /></AdminField>
      <AdminField label="Loại"><AdminSelect name="placementType" defaultValue={text(row, "placement_type") || "banner"}><option value="banner">banner</option><option value="provider_listing">provider_listing</option><option value="offering_listing">offering_listing</option><option value="mixed">mixed</option><option value="popup">popup</option><option value="floating">floating</option><option value="announcement">announcement</option></AdminSelect></AdminField>
      <AdminField label="Display mode"><AdminSelect name="displayMode" defaultValue={text(row, "display_mode") || "inline_banner"}><option value="inline_banner">inline_banner</option><option value="modal">modal popup</option><option value="floating">floating</option><option value="top_bar">top_bar</option><option value="bottom_bar">bottom_bar</option></AdminSelect></AdminField>
      <AdminField label="Position"><AdminSelect name="position" defaultValue={String(meta.position ?? "bottom_right")}><option value="">auto</option><option value="top">top</option><option value="bottom">bottom</option><option value="center">center</option><option value="bottom_right">bottom_right</option><option value="bottom_left">bottom_left</option></AdminSelect></AdminField>
      <AdminField label="Surface"><AdminSelect name="surface" defaultValue={text(row, "surface") || "website"}><option value="website">website</option><option value="provider_directory">provider_directory</option><option value="category">category</option><option value="search">search</option><option value="blog">blog</option><option value="checkout">checkout</option><option value="footer">footer</option></AdminSelect></AdminField>
      <AdminField label="Max items"><AdminInput name="maxItems" type="number" min="1" defaultValue={text(row, "max_items") || "1"} /></AdminField>
      <AdminField label="Active"><AdminSelect name="isActive" defaultValue={bool(row, "is_active", true) ? "true" : "false"}><option value="true">true</option><option value="false">false</option></AdminSelect></AdminField>
      <AdminField label="Global enabled"><AdminSelect name="globalEnabled" defaultValue={String(meta.globalEnabled ?? "false")}><option value="false">false</option><option value="true">true</option></AdminSelect></AdminField>
      <AdminField label="Device"><AdminSelect name="deviceRules" defaultValue={String(meta.deviceRules ?? "all")}><option value="all">all</option><option value="desktop">desktop</option><option value="mobile">mobile</option></AdminSelect></AdminField>
      <AdminField label="Delay ms"><AdminInput name="showDelayMs" type="number" min="0" defaultValue={String(meta.showDelayMs ?? 0)} /></AdminField>
      <AdminField label="Dismiss"><AdminSelect name="dismissMode" defaultValue={String(meta.dismissMode ?? "session")}><option value="session">session</option><option value="hours">hours</option><option value="days">days</option><option value="forever">forever</option></AdminSelect></AdminField>
      <AdminField label="Dismiss TTL hours"><AdminInput name="dismissTtlHours" type="number" min="0" defaultValue={String(meta.dismissTtlHours ?? 24)} /></AdminField>
      <AdminField label="Target pages" className="md:col-span-3"><AdminTextarea name="targetPages" rows={3} defaultValue={listValue(meta.targetPages)} placeholder={"/\n/mau-thiep\n/blog/*"} /></AdminField>
      <AdminField label="Include rules" className="md:col-span-3"><AdminTextarea name="includeRules" rows={2} defaultValue={listValue(pageRules.include)} /></AdminField>
      <AdminField label="Exclude rules" className="md:col-span-3"><AdminTextarea name="excludeRules" rows={2} defaultValue={listValue(pageRules.exclude)} /></AdminField>
      <AdminField label="Mô tả" className="md:col-span-3"><AdminTextarea name="description" rows={3} defaultValue={text(row, "description")} /></AdminField>
      <div className="md:col-span-3"><AdminSubmitButton>{row ? "Lưu placement" : "Tạo placement"}</AdminSubmitButton></div>
    </NativeForm>
  );
}

export function CreativeForm({ row, advertisers, targetUrlOptions = [] }: { row?: Row | null; advertisers: Option[]; targetUrlOptions?: TargetUrlOption[] }) {
  const meta = metadata(row);
  return (
    <NativeForm action={ROUTES.API.ADMIN.MARKETING.ADS.CREATIVES} method="POST" className="grid gap-4 md:grid-cols-3">
      <FormIdentity row={row} />
      <AdminField label="Advertiser"><AdminSelect name="advertiserId" defaultValue={text(row, "advertiser_id")}><option value="">PinkLove / nội bộ</option>{advertisers.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</AdminSelect></AdminField>
      <AdminField label="Tên creative" required><AdminInput name="title" defaultValue={text(row, "title")} required /></AdminField>
      <AdminField label="Status"><AdminSelect name="status" defaultValue={text(row, "status") || "draft"}><option value="draft">draft</option><option value="pending">pending</option><option value="approved">approved</option><option value="rejected">rejected</option><option value="archived">archived</option></AdminSelect></AdminField>
      <AdminField label="Layout"><AdminSelect name="layout" defaultValue={String(meta.layout ?? "image_text")}><option value="image_text">image_text</option><option value="image_only">image_only</option><option value="text_card">text_card</option><option value="html">html</option></AdminSelect></AdminField>
      <AdminField label="Image URL" required><AdminInput name="imageUrl" defaultValue={text(row, "image_url")} required /></AdminField>
      <AdminField label="Mobile image URL"><AdminInput name="mobileImageUrl" defaultValue={text(row, "mobile_image_url")} /></AdminField>
      <AdminField label="Target URL"><TargetUrlSelect value={text(row, "target_url")} options={targetUrlOptions} /></AdminField>
      <AdminField label="Alt text"><AdminInput name="altText" defaultValue={text(row, "alt_text")} /></AdminField>
      <AdminField label="Headline"><AdminInput name="headline" defaultValue={text(row, "headline")} /></AdminField>
      <AdminField label="CTA"><AdminInput name="ctaLabel" defaultValue={text(row, "cta_label")} /></AdminField>
      <AdminField label="Badge"><AdminInput name="badgeLabel" defaultValue={String(meta.badgeLabel ?? "")} /></AdminField>
      <AdminField label="Body" className="md:col-span-3"><AdminTextarea name="body" rows={3} defaultValue={text(row, "body")} /></AdminField>
      <div className="md:col-span-3"><AdminSubmitButton>{row ? "Lưu creative" : "Tạo creative"}</AdminSubmitButton></div>
    </NativeForm>
  );
}

export function CampaignForm({ row, advertisers, placements, creatives, targetUrlOptions = [] }: { row?: Row | null; advertisers: Option[]; placements: Option[]; creatives: Option[]; targetUrlOptions?: TargetUrlOption[] }) {
  const meta = metadata(row);
  return (
    <NativeForm action={ROUTES.API.ADMIN.MARKETING.ADS.CAMPAIGNS} method="POST" className="grid gap-4 md:grid-cols-3">
      <FormIdentity row={row} />
      <AdminField label="Tên campaign" required><AdminInput name="name" defaultValue={text(row, "name")} required /></AdminField>
      <AdminField label="Advertiser" required><AdminSelect name="advertiserId" defaultValue={text(row, "advertiser_id")} required><option value="">Chọn advertiser</option>{advertisers.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</AdminSelect></AdminField>
      <AdminField label="Placement" required><AdminSelect name="placementId" defaultValue={text(row, "placement_id")} required><option value="">Chọn placement</option>{placements.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</AdminSelect></AdminField>
      <AdminField label="Creative"><AdminSelect name="creativeId" defaultValue={text(row, "creative_id")}><option value="">Chưa gắn creative</option>{creatives.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</AdminSelect></AdminField>
      <AdminField label="Status"><AdminSelect name="status" defaultValue={text(row, "status") || "draft"}><option value="draft">draft</option><option value="pending">pending</option><option value="approved">approved</option><option value="active">active</option><option value="paused">paused</option><option value="expired">expired</option><option value="rejected">rejected</option><option value="archived">archived</option></AdminSelect></AdminField>
      <AdminField label="Payment"><AdminSelect name="paymentStatus" defaultValue={text(row, "payment_status") || "unpaid"}><option value="unpaid">unpaid</option><option value="pending">pending</option><option value="paid">paid</option><option value="refunded">refunded</option><option value="waived">waived</option></AdminSelect></AdminField>
      <AdminField label="Price"><AdminInput name="price" type="number" min="0" defaultValue={text(row, "price") || "0"} /></AdminField>
      <AdminField label="Priority"><AdminInput name="priority" type="number" min="0" defaultValue={String(meta.priority ?? 0)} /></AdminField>
      <AdminField label="Sponsored"><AdminSelect name="isSponsored" defaultValue={String(meta.isSponsored ?? "true")}><option value="true">true</option><option value="false">false / internal</option></AdminSelect></AdminField>
      <AdminField label="Dismissible"><AdminSelect name="isDismissible" defaultValue={String(meta.isDismissible ?? "true")}><option value="true">true</option><option value="false">false</option></AdminSelect></AdminField>
      <AdminField label="Start"><AdminInput name="startsAt" type="datetime-local" defaultValue={text(row, "starts_at").slice(0, 16)} /></AdminField>
      <AdminField label="End"><AdminInput name="endsAt" type="datetime-local" defaultValue={text(row, "ends_at").slice(0, 16)} /></AdminField>
      <AdminField label="Target URL"><TargetUrlSelect value={text(row, "target_url")} options={targetUrlOptions} /></AdminField>
      <AdminField label="Notes" className="md:col-span-2"><AdminTextarea name="notes" rows={3} defaultValue={text(row, "notes")} /></AdminField>
      <div className="md:col-span-3"><AdminSubmitButton>{row ? "Lưu campaign" : "Tạo campaign"}</AdminSubmitButton></div>
    </NativeForm>
  );
}

export function ProviderPlanForm({ row, placements }: { row?: Row | null; placements: Option[] }) {
  return (
    <NativeForm action={ROUTES.API.ADMIN.MARKETING.ADS.PROVIDER_PLANS} method="POST" className="grid gap-4 md:grid-cols-2">
      <FormIdentity row={row} />
      <AdminField label="Key" required><AdminInput name="key" defaultValue={text(row, "key")} required /></AdminField>
      <AdminField label="Tên gói" required><AdminInput name="name" defaultValue={text(row, "name")} required /></AdminField>
      <AdminField label="Placement"><AdminSelect name="placementId" defaultValue={text(row, "placement_id")}><option value="">Không cố định</option>{placements.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</AdminSelect></AdminField>
      <AdminField label="Price"><AdminInput name="price" type="number" min="0" defaultValue={text(row, "price") || "0"} /></AdminField>
      <AdminField label="Duration days"><AdminInput name="durationDays" type="number" min="1" defaultValue={text(row, "duration_days") || "30"} /></AdminField>
      <AdminField label="Priority weight"><AdminInput name="priorityWeight" type="number" min="0" defaultValue={text(row, "priority_weight") || "100"} /></AdminField>
      <AdminField label="Active"><AdminSelect name="isActive" defaultValue={bool(row, "is_active", true) ? "true" : "false"}><option value="true">true</option><option value="false">false</option></AdminSelect></AdminField>
      <AdminField label="Mô tả" className="md:col-span-2"><AdminTextarea name="description" rows={3} defaultValue={text(row, "description")} /></AdminField>
      <div className="md:col-span-2"><AdminSubmitButton>{row ? "Lưu gói" : "Tạo gói"}</AdminSubmitButton></div>
    </NativeForm>
  );
}

export function ProviderPromotionForm({ row, providers, plans, placements }: { row?: Row | null; providers: Option[]; plans: Option[]; placements: Option[] }) {
  return (
    <NativeForm action={ROUTES.API.ADMIN.MARKETING.ADS.PROVIDER_PROMOTIONS} method="POST" className="grid gap-4 md:grid-cols-2">
      <FormIdentity row={row} />
      <AdminField label="Provider" required><AdminSelect name="providerId" defaultValue={text(row, "provider_id")} required><option value="">Chọn provider</option>{providers.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</AdminSelect></AdminField>
      <AdminField label="Tiêu đề" required><AdminInput name="title" defaultValue={text(row, "title")} required /></AdminField>
      <AdminField label="Gói"><AdminSelect name="planId" defaultValue={text(row, "plan_id")}><option value="">Không gắn gói</option>{plans.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</AdminSelect></AdminField>
      <AdminField label="Placement"><AdminSelect name="placementId" defaultValue={text(row, "placement_id")}><option value="">Theo gói / không cố định</option>{placements.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</AdminSelect></AdminField>
      <AdminField label="Target type"><AdminSelect name="targetType" defaultValue={text(row, "target_type") || "provider"}><option value="provider">provider</option><option value="offering">offering</option><option value="category">category</option><option value="search">search</option></AdminSelect></AdminField>
      <AdminField label="Target ID"><AdminInput name="targetId" defaultValue={text(row, "target_id")} /></AdminField>
      <AdminField label="Status"><AdminSelect name="status" defaultValue={text(row, "status") || "pending"}><option value="draft">draft</option><option value="pending">pending</option><option value="approved">approved</option><option value="active">active</option><option value="paused">paused</option><option value="expired">expired</option><option value="rejected">rejected</option><option value="archived">archived</option></AdminSelect></AdminField>
      <AdminField label="Payment"><AdminSelect name="paymentStatus" defaultValue={text(row, "payment_status") || "unpaid"}><option value="unpaid">unpaid</option><option value="pending">pending</option><option value="paid">paid</option><option value="refunded">refunded</option><option value="waived">waived</option></AdminSelect></AdminField>
      <AdminField label="Priority weight"><AdminInput name="priorityWeight" type="number" min="0" defaultValue={text(row, "priority_weight") || "100"} /></AdminField>
      <AdminField label="Price"><AdminInput name="price" type="number" min="0" defaultValue={text(row, "price") || "0"} /></AdminField>
      <AdminField label="Start"><AdminInput name="startsAt" type="datetime-local" defaultValue={text(row, "starts_at").slice(0, 16)} /></AdminField>
      <AdminField label="End"><AdminInput name="endsAt" type="datetime-local" defaultValue={text(row, "ends_at").slice(0, 16)} /></AdminField>
      <AdminField label="Admin notes" className="md:col-span-2"><AdminTextarea name="adminNotes" rows={3} defaultValue={text(row, "admin_notes")} /></AdminField>
      <div className="md:col-span-2"><AdminSubmitButton>{row ? "Lưu ưu tiên" : "Tạo ưu tiên"}</AdminSubmitButton></div>
    </NativeForm>
  );
}
