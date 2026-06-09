"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/common/confirm-provider";
import { FieldsEditor } from "@/components/common/fields-editor";
import { NativeForm } from "@/components/common/native-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminDeleteButton, AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import type { FieldSchema } from "@/features/pages/schema";
import type { Offering } from "@/features/offerings/types";
import {
  fromSectionEditorValues,
  getLandingPageSectionFields,
  toSectionEditorValues,
} from "@/features/landing-pages/admin/landing-page-section-fields";
import {
  LANDING_PAGE_SECTION_TYPES,
  LANDING_PAGE_STATUSES,
  type LandingPageNavLink,
  type LandingPageWithSource,
  type LandingPageSection,
  type LandingPageSectionType,
} from "@/features/landing-pages/types";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import { ROUTES } from "@/lib/routes";

type EditableSection = {
  id: string;
  sectionType: LandingPageSectionType;
  content: Record<string, unknown>;
};

type LandingPageEditorFormProps = {
  landingPage: LandingPageWithSource;
  sections: LandingPageSection[];
  offerings: Array<Pick<Offering, "id" | "name" | "status">>;
};

const HEADER_TAB_ID = "landing-header";
const FOOTER_TAB_ID = "landing-footer";

function createSection(sectionType: LandingPageSectionType = "custom"): EditableSection {
  return {
    id: crypto.randomUUID(),
    sectionType,
    content: {},
  };
}

const SECTION_TYPE_LABELS: Record<LandingPageSectionType, string> = {
  hero: "Hero",
  gallery: "Thư viện ảnh",
  video: "Video",
  reviews: "Đánh giá",
  faq: "FAQ",
  countdown: "Đếm ngược",
  cta: "CTA",
  pricing: "Giá bán",
  features: "Điểm nổi bật",
  related_products: "Liên quan",
  custom: "Tùy chỉnh",
};

const HEADER_FIELDS: FieldSchema[] = [
  { name: "hidden", label: "Ẩn", type: "switch", width: 12 },
  { name: "brandLabel", label: "Thương hiệu", type: "text", width: 6 },
  { name: "brandHref", label: "Link", type: "text", width: 6 },
  {
    name: "links",
    label: "Menu",
    type: "repeater",
    addLabel: "Thêm liên kết",
    width: 12,
    fields: [
      { name: "label", label: "Nhãn", type: "text", width: 5 },
      { name: "href", label: "Đường dẫn", type: "text", width: 7 },
    ],
  },
  { name: "ctaLabel", label: "Nhãn CTA", type: "text", width: 5 },
  { name: "ctaHref", label: "Link CTA", type: "text", width: 7 },
];

const FOOTER_FIELDS: FieldSchema[] = [
  { name: "hidden", label: "Ẩn", type: "switch", width: 12 },
  { name: "title", label: "Tiêu đề", type: "text", width: 12 },
  { name: "description", label: "Mô tả", type: "textarea", rows: 3, width: 12 },
  {
    name: "links",
    label: "Liên kết",
    type: "repeater",
    addLabel: "Thêm liên kết",
    width: 12,
    fields: [
      { name: "label", label: "Nhãn", type: "text", width: 5 },
      { name: "href", label: "Đường dẫn", type: "text", width: 7 },
    ],
  },
  { name: "copyright", label: "Copyright", type: "text", width: 12 },
];

function getThemeLinks(value: unknown): LandingPageNavLink[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }
    const record = item as Record<string, unknown>;
    const label = typeof record.label === "string" ? record.label : "";
    const href = typeof record.href === "string" ? record.href : "";
    return label || href ? [{ label, href }] : [];
  });
}

function getThemeContent(value: unknown, fallback: Record<string, unknown>) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? { ...fallback, ...(value as Record<string, unknown>) }
    : fallback;
}

export function LandingPageEditorForm({ landingPage, sections, offerings }: LandingPageEditorFormProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const initialRows = useMemo(
    () => sections.length
      ? sections.map((section) => ({
          id: section.id,
          sectionType: section.sectionType,
          content: toSectionEditorValues(section.content),
        }))
      : [createSection("hero")],
    [sections]
  );
  const [rows, setRows] = useState<EditableSection[]>(initialRows);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(HEADER_TAB_ID);
  const [newSectionType, setNewSectionType] = useState<LandingPageSectionType>("custom");
  const [headerContent, setHeaderContent] = useState<Record<string, unknown>>(
    getThemeContent(landingPage.themeConfig.header, {
      hidden: false,
      brandLabel: "PinkLove",
      brandHref: ROUTES.HOME,
      ctaLabel: "Chọn ngay",
      ctaHref: "#checkout",
    })
  );
  const [footerContent, setFooterContent] = useState<Record<string, unknown>>(
    getThemeContent(landingPage.themeConfig.footer, {
      hidden: false,
      title: landingPage.name,
      description: "",
      copyright: `PinkLove · ${landingPage.name}`,
    })
  );
  const headerLinks = getThemeLinks(headerContent.links);
  const footerLinks = getThemeLinks(footerContent.links);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const sectionsJson = useMemo(
    () => JSON.stringify(
      rows.map((row) => ({
        sectionType: row.sectionType,
        content: fromSectionEditorValues(row.content),
      }))
    ),
    [rows]
  );
  const activeSection = rows.find((row) => row.id === activeWorkspaceId) ?? rows[0];
  const activeSectionIndex = rows.findIndex((row) => row.id === activeSection.id);
  const editingHeader = activeWorkspaceId === HEADER_TAB_ID;
  const editingFooter = activeWorkspaceId === FOOTER_TAB_ID;

  function addSection() {
    const nextSection = createSection(newSectionType);
    setRows((current) => [...current, nextSection]);
    setActiveWorkspaceId(nextSection.id);
  }

  function removeSection(sectionId: string) {
    if (rows.length === 1) {
      return;
    }

    const sectionIndex = rows.findIndex((row) => row.id === sectionId);
    const nextRows = rows.filter((row) => row.id !== sectionId);
    setRows(nextRows);

    if (activeWorkspaceId === sectionId) {
      setActiveWorkspaceId(nextRows[Math.min(sectionIndex, nextRows.length - 1)].id);
    }
  }

  function moveSection(sectionId: string, direction: -1 | 1) {
    setRows((current) => {
      const currentIndex = current.findIndex((row) => row.id === sectionId);
      const nextIndex = currentIndex + direction;
      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const nextRows = [...current];
      [nextRows[currentIndex], nextRows[nextIndex]] = [nextRows[nextIndex], nextRows[currentIndex]];
      return nextRows;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    formData.set("sectionsJson", sectionsJson);
    setSaving(true);
    try {
      const result = await adminApi.updateLandingPage(formData);
      toast.success(result.message ?? "Đã cập nhật landing page.");
      finishMutation(router, result, { redirect: "replace", refresh: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật landing page.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const isConfirmed = await confirm({
      title: "Xóa landing page",
      description: `Xóa “${landingPage.name}” và dữ liệu liên quan?`,
      confirmText: "Xóa",
      cancelText: "Hủy",
      variant: "destructive",
    });

    if (!isConfirmed) {
      return;
    }

    setDeleting(true);
    try {
      const formData = new FormData();
      formData.set("landingPageId", landingPage.id);
      const result = await adminApi.deleteLandingPage(formData);
      toast.success(result.message ?? "Đã xóa landing page.");
      finishMutation(router, result, { redirect: "push", refresh: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa landing page.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <NativeForm action={adminApiActions.updateLandingPage} method="POST" className="grid gap-6 lg:grid-cols-12" onSubmit={handleSubmit}>
      <input type="hidden" name="landingPageId" value={landingPage.id} />
      <input type="hidden" name="sectionsJson" value={sectionsJson} />
      <input
        type="hidden"
        name="chromeContentJson"
        value={JSON.stringify({
          header: { ...headerContent, links: headerLinks },
          footer: { ...footerContent, links: footerLinks },
        })}
      />

      <div className="min-w-0 space-y-6 lg:col-span-9">
        <Card className="min-w-0 overflow-visible rounded-lg gap-0">
          <CardHeader className="border-b gap-0 pb-0">
            <CardTitle>Thông tin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tên</label>
                <Input name="name" defaultValue={landingPage.name} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Slug</label>
                <Input name="slug" defaultValue={landingPage.slug} pattern="[a-z0-9]+(-[a-z0-9]+)*" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden rounded-lg gap-0">
          <CardHeader className="border-b gap-0 pb-0">
            <CardTitle>Nội dung</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid min-h-[34rem] lg:grid-cols-[220px_minmax(0,1fr)]">
              <div className="flex flex-col border-b bg-white lg:border-r lg:border-b-0">
                <div className="grid gap-1 p-3">
                  <button
                    type="button"
                    className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                      editingHeader
                        ? "border-primary/30 bg-primary/5"
                        : "border-border/50 bg-white hover:border-primary/30 hover:bg-primary/5"
                    }`}
                    onClick={() => setActiveWorkspaceId(HEADER_TAB_ID)}
                  >
                    <span className="block font-medium">Header</span>
                  </button>

                  {rows.map((row, index) => {
                    const active = activeWorkspaceId === row.id;
                    return (
                      <button
                        key={row.id}
                        type="button"
                        className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                          active
                            ? "border-primary/30 bg-primary/5"
                            : "border-border/50 bg-white hover:border-primary/30 hover:bg-primary/5"
                        }`}
                        onClick={() => setActiveWorkspaceId(row.id)}
                      >
                        <span className="block truncate font-medium">
                          {index + 1}. {SECTION_TYPE_LABELS[row.sectionType]}
                        </span>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                      editingFooter
                        ? "border-primary/30 bg-primary/5"
                        : "border-border/50 bg-white hover:border-primary/30 hover:bg-primary/5"
                    }`}
                    onClick={() => setActiveWorkspaceId(FOOTER_TAB_ID)}
                  >
                    <span className="block font-medium">Footer</span>
                  </button>
                </div>

                <div className="mt-auto space-y-2 border-t p-3">
                  <select
                    value={newSectionType}
                    onChange={(event) => setNewSectionType(event.target.value as LandingPageSectionType)}
                    className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none"
                  >
                    {LANDING_PAGE_SECTION_TYPES.map((sectionType) => (
                      <option key={sectionType} value={sectionType}>
                        {SECTION_TYPE_LABELS[sectionType]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition hover:bg-muted"
                    onClick={addSection}
                  >
                    <Plus className="h-4 w-4" />
                    Thêm section
                  </button>
                </div>
              </div>

              <div className="min-w-0 p-5 md:p-6">
                {editingHeader || editingFooter ? (
                  <>
                    <div className="mb-6 border-b pb-5">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Nội dung
                      </p>
                      <h3 className="mt-1 text-lg font-semibold">
                        {editingHeader ? "Header" : "Footer"}
                      </h3>
                    </div>

                    <div className="space-y-6">
                      <FieldsEditor
                        fields={editingHeader ? HEADER_FIELDS : FOOTER_FIELDS}
                        values={editingHeader ? headerContent : footerContent}
                        showTabs={false}
                        className="grid grid-cols-12 gap-4"
                        onChange={(name, value) => {
                          if (editingHeader) {
                            setHeaderContent((current) => ({ ...current, [name]: value }));
                          } else {
                            setFooterContent((current) => ({ ...current, [name]: value }));
                          }
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b pb-5">
                      <div className="space-y-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Section {activeSectionIndex + 1} / {rows.length}
                        </p>
                        <h3 className="text-lg font-semibold">
                          {SECTION_TYPE_LABELS[activeSection.sectionType]}
                        </h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={activeSection.sectionType}
                          className="h-9 rounded-md border bg-background px-2 text-sm outline-none"
                          onChange={(event) => {
                            const sectionType = event.target.value as LandingPageSectionType;
                            setRows((current) => current.map((item) => (
                              item.id === activeSection.id ? { ...item, sectionType, content: {} } : item
                            )));
                          }}
                        >
                          {LANDING_PAGE_SECTION_TYPES.map((sectionType) => (
                            <option key={sectionType} value={sectionType}>
                              {SECTION_TYPE_LABELS[sectionType]}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={() => moveSection(activeSection.id, -1)}
                          aria-label="Di chuyển section lên"
                          disabled={activeSectionIndex === 0}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={() => moveSection(activeSection.id, 1)}
                          aria-label="Di chuyển section xuống"
                          disabled={activeSectionIndex === rows.length - 1}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={() => removeSection(activeSection.id)}
                          aria-label="Xóa section"
                          disabled={rows.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <FieldsEditor
                      fields={getLandingPageSectionFields(activeSection.sectionType)}
                      values={activeSection.content}
                      showTabs={false}
                      className="grid grid-cols-12 gap-4"
                      onChange={(name, value) => {
                        setRows((current) => current.map((item) => (
                          item.id === activeSection.id
                            ? { ...item, content: { ...item.content, [name]: value } }
                            : item
                        )));
                      }}
                    />
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="min-w-0 space-y-6 lg:sticky lg:top-20 lg:col-span-3 lg:self-start">
        <Card className="min-w-0 rounded-lg lg:self-start">
          <CardHeader>
            <CardTitle>Xuất bản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="font-medium">Sản phẩm nguồn</label>
              <select
                name="sourceOfferingId"
                defaultValue={landingPage.sourceOfferingId}
                className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
                required
              >
                <option value="">Chọn sản phẩm</option>
                {offerings.map((offering) => (
                  <option key={offering.id} value={offering.id}>
                    {offering.name} · {offering.status}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="font-medium">Trạng thái</label>
              <select name="status" defaultValue={landingPage.status} className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none">
                {LANDING_PAGE_STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <AdminSubmitButton className="w-full rounded-md" type="submit" disabled={saving || deleting}>
              {saving ? "Đang lưu..." : "Lưu"}
            </AdminSubmitButton>

            <div className="border-t pt-4">
              <AdminDeleteButton className="w-full rounded-md" type="button" disabled={saving || deleting} onClick={() => void handleDelete()}>
                {deleting ? "Đang xóa..." : "Xóa"}
              </AdminDeleteButton>
            </div>
          </CardContent>
        </Card>

      </div>
    </NativeForm>
  );
}
