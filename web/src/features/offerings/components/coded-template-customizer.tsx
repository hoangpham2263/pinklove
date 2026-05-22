"use client";

import { useMemo, useState } from "react";
import { GuestButton, GuestLinkButton } from "@/app/(guest)/_components/guest-ui";
import type { FieldSchema, TextFieldSchema } from "@/features/pages/schema";
import type { Offering } from "@/features/offerings/types";
import { getTemplateOfferingPath } from "@/lib/public-paths";
import { ROUTES } from "@/lib/routes";

type CodedTemplateCustomizerProps = {
  offering: Offering;
  fields: FieldSchema[];
  initialValues: Record<string, unknown>;
};

function getString(values: Record<string, unknown>, key: string, fallback = "") {
  const value = values[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function renderHiddenInputs(values: Record<string, unknown>) {
  return Object.entries(values).flatMap(([key, value]) => {
    if (Array.isArray(value)) {
      return value.map((item, index) => (
        <input key={`${key}-${index}`} type="hidden" name={key} value={String(item)} />
      ));
    }

    if (typeof value === "object" && value) {
      return [];
    }

    return <input key={key} type="hidden" name={key} value={String(value ?? "")} />;
  });
}

const primaryFieldNames = new Set(["brideName", "groomName", "eventDate", "venue", "heroSubtitle"]);
type CompactEditableField = TextFieldSchema & { type: "text" | "textarea" };

function renderCompactField(
  field: CompactEditableField,
  value: unknown,
  onChange: (name: string, value: string) => void
) {
  return (
    <label key={field.name} className="block space-y-2">
      <span className="text-sm font-medium">{field.label}</span>
      {field.type === "textarea" ? (
        <textarea
          value={String(value ?? "")}
          onChange={(event) => onChange(field.name, event.target.value)}
          rows={field.rows ?? 4}
          className="min-h-28 w-full resize-none rounded-md border bg-background px-3 py-2 text-sm leading-6 outline-none"
          placeholder={field.label}
        />
      ) : (
        <input
          value={String(value ?? "")}
          onChange={(event) => onChange(field.name, event.target.value)}
          className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none"
          placeholder={field.label}
        />
      )}
    </label>
  );
}

function CompactCodedFields({
  fields,
  values,
  onChange,
}: {
  fields: FieldSchema[];
  values: Record<string, unknown>;
  onChange: (name: string, value: string) => void;
}) {
  const editableFields = fields.filter(
    (field): field is CompactEditableField =>
      field.type === "text" || field.type === "textarea"
  );
  const primaryFields = editableFields.filter((field) => primaryFieldNames.has(field.name));
  const secondaryFields = editableFields.filter((field) => !primaryFieldNames.has(field.name));
  const [activeMenu, setActiveMenu] = useState<"primary" | "secondary">("primary");
  const activeFields = activeMenu === "primary" ? primaryFields : secondaryFields;
  return (
    <div className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)]">
      <nav className="md:self-start">
        <div className="grid gap-2">
          <button
            type="button"
            onClick={() => setActiveMenu("primary")}
            className={`rounded-md border px-3 py-2 text-left text-sm ${
              activeMenu === "primary"
                ? "bg-foreground text-background"
                : "bg-background text-muted-foreground"
            }`}
          >
            Thông tin chính
          </button>
          {secondaryFields.length > 0 ? (
            <button
              type="button"
              onClick={() => setActiveMenu("secondary")}
              className={`rounded-md border px-3 py-2 text-left text-sm ${
                activeMenu === "secondary"
                  ? "bg-foreground text-background"
                  : "bg-background text-muted-foreground"
              }`}
            >
              Nội dung thêm
            </button>
          ) : null}
        </div>
      </nav>

      <div className="min-w-0 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {activeFields
            .filter((field) => field.type === "text")
            .map((field) => renderCompactField(field, values[field.name], onChange))}
        </div>

        {activeFields
          .filter((field) => field.type === "textarea")
          .map((field) => renderCompactField(field, values[field.name], onChange))}

        {activeMenu === "secondary" && secondaryFields.length === 0 ? (
          <div className="rounded-md border p-4 text-sm text-muted-foreground">
            Không có nội dung thêm cho mẫu này.
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function CodedTemplateCustomizer({ offering, fields, initialValues }: CodedTemplateCustomizerProps) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const coupleName = useMemo(() => {
    const brideName = getString(values, "brideName");
    const groomName = getString(values, "groomName");
    return [groomName, brideName].filter(Boolean).join(" & ") || offering.name;
  }, [offering.name, values]);
  const isClassicLayout = ["golden_aisle", "moonlight_garden", "pearl_manor"].includes(offering.templateKey);

  return (
    <section className="px-4 pb-10 pt-30">
      <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-12">
        <form action={ROUTES.API.CUSTOMER.INVITATIONS.CREATE_FROM_OFFERING} method="POST" className="min-w-0 rounded-md border bg-background lg:col-span-8">
          <input type="hidden" name="offeringSlug" value={offering.slug} />
          {renderHiddenInputs(values)}
          <div className="space-y-2 border-b px-5 py-5 md:px-6">
            <p className="text-sm font-medium uppercase">Nhập thông tin</p>
            <h1 className="text-2xl font-semibold">Xem trước {offering.name}</h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              Điền thông tin của bạn để xem mẫu thiệp hiển thị như thế nào. Khi đã ưng ý, bạn có thể tiếp tục tạo thiệp trong tài khoản.
            </p>
          </div>

          <div className="px-5 py-5 md:px-6">
            <CompactCodedFields
              fields={fields}
              values={values}
              onChange={(name, value) => setValues((current) => ({ ...current, [name]: value }))}
            />
          </div>

          <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row md:px-6">
            <GuestButton type="submit" className="sm:min-w-56">
              Tiếp tục tạo thiệp
            </GuestButton>
            <GuestLinkButton href={getTemplateOfferingPath(offering)} variant="secondary">
              Quay lại mẫu
            </GuestLinkButton>
          </div>
        </form>

        <div className="min-w-0 lg:col-span-4">
          <div className="sticky top-24 overflow-hidden rounded-sm bg-white shadow-sm">
            <div className="border-b border-stone-100 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.25em] text-stone-400">Xem trước</p>
              <p className="mt-1 text-sm text-stone-600">Nội dung sẽ thay đổi theo thông tin bạn nhập.</p>
            </div>
            <div className="min-h-[680px] overflow-hidden">
              {isClassicLayout ? (
                <div className="min-h-[680px] bg-[radial-gradient(circle_at_top,#f4f0e8,white_58%)] p-6 md:p-10">
                  <div className="rounded-sm border border-stone-200 bg-white/90 p-7 md:p-10">
                    <p className="text-xs uppercase tracking-[0.35em] text-stone-500">Save The Date</p>
                    <h2 className="mt-5 text-4xl font-semibold leading-tight text-stone-950 md:text-6xl">
                      {coupleName}
                    </h2>
                    <p className="mt-6 max-w-xl text-sm leading-7 text-stone-600">
                      {getString(values, "heroSubtitle", "Trân trọng kính mời bạn đến chung vui trong ngày trọng đại của chúng tôi.")}
                    </p>
                    <div className="mt-9 grid gap-5 md:grid-cols-[1fr_0.9fr]">
                      <div className="rounded-sm border border-stone-200 bg-stone-50 p-6">
                        <p className="text-lg font-semibold text-stone-950">
                          {getString(values, "storyTitle", "Câu chuyện của chúng tôi")}
                        </p>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-stone-600">
                          {getString(values, "storyBody", "Phần nội dung này giúp bạn hình dung câu chuyện sẽ xuất hiện trên thiệp như thế nào.")}
                        </p>
                      </div>
                      <div className="rounded-sm border border-amber-100 bg-amber-50 p-6">
                        <span className="text-xs uppercase tracking-[0.25em] text-amber-700">Lễ cưới</span>
                        <span className="mt-3 block text-2xl font-semibold text-stone-950">
                          {getString(values, "eventDate", "15.12.2026")}
                        </span>
                        <span className="mt-2 block text-sm leading-6 text-stone-600">
                          {getString(values, "venue", "White Palace, TP.HCM")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[680px] flex-col justify-center bg-[linear-gradient(180deg,#fff7f7,#ffffff)] p-8 text-center">
                  <p className="text-xs uppercase tracking-[0.35em] text-orange-600">Wedding invitation</p>
                  <h2 className="mt-5 text-4xl font-semibold leading-tight text-stone-950 md:text-6xl">{coupleName}</h2>
                  <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-stone-600">
                    {getString(values, "heroSubtitle", "Trân trọng kính mời bạn đến chung vui trong ngày trọng đại của chúng tôi.")}
                  </p>
                  <div className="mx-auto mt-8 inline-flex flex-col rounded-sm border border-orange-100 bg-orange-50 px-8 py-5">
                    <span className="text-xs uppercase tracking-[0.25em] text-orange-600">Thời gian</span>
                    <span className="mt-2 text-2xl font-semibold text-stone-950">{getString(values, "eventDate", "15.12.2026")}</span>
                    <span className="mt-1 text-sm text-stone-600">{getString(values, "venue", "White Palace, TP.HCM")}</span>
                  </div>
                  <div className="mx-auto mt-10 max-w-xl text-left">
                    <p className="text-lg font-semibold text-stone-950">{getString(values, "storyTitle", "Câu chuyện của chúng tôi")}</p>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-stone-600">
                      {getString(values, "storyBody", "Phần nội dung này giúp bạn hình dung câu chuyện sẽ xuất hiện trên thiệp như thế nào.")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
