import { saveOfferingType } from "@/features/offerings/server/service";
import type { OfferingTypeField } from "@/features/offerings/types";
import { respondError, respondSuccess } from "@/lib/action-response";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

const validFieldTypes = new Set([
  "text",
  "textarea",
  "richtext",
  "number",
  "boolean",
  "select",
  "multiselect",
  "date",
  "datetime",
  "media",
  "gallery",
  "price",
  "location",
  "json",
  "repeater",
  "relation",
  "blocks",
  "url",
]);

function parseFieldSchema(raw: string): OfferingTypeField[] {
  if (!raw.trim()) {
    return [];
  }

  const value = JSON.parse(raw) as unknown;
  if (!Array.isArray(value)) {
    throw new Error("INVALID_FIELD_SCHEMA");
  }

  return value
    .map((item) => (item && typeof item === "object" ? (item as Record<string, unknown>) : null))
    .filter(Boolean)
    .map((item) => ({
      key: String(item?.key ?? "").trim(),
      label: String(item?.label ?? "").trim(),
      type: String(item?.type ?? "text") as OfferingTypeField["type"],
      required: Boolean(item?.required),
      placeholder: typeof item?.placeholder === "string" ? item.placeholder : undefined,
      options: Array.isArray(item?.options) ? item.options.map(String) : undefined,
      defaultValue: item?.defaultValue,
      validationRules: item?.validationRules && typeof item.validationRules === "object" ? (item.validationRules as Record<string, unknown>) : undefined,
      uiConfig: item?.uiConfig && typeof item.uiConfig === "object" ? (item.uiConfig as Record<string, unknown>) : undefined,
      sortOrder: Number.isFinite(Number(item?.sortOrder)) ? Number(item?.sortOrder) : undefined,
      visibilityConditions:
        item?.visibilityConditions && typeof item.visibilityConditions === "object"
          ? (item.visibilityConditions as Record<string, unknown>)
          : undefined,
      dependencyConditions:
        item?.dependencyConditions && typeof item.dependencyConditions === "object"
          ? (item.dependencyConditions as Record<string, unknown>)
          : undefined,
      relationTarget: typeof item?.relationTarget === "string" ? item.relationTarget : undefined,
      relationMultiple: Boolean(item?.relationMultiple),
      relationConfig:
        item?.relationConfig && typeof item.relationConfig === "object" ? (item.relationConfig as Record<string, unknown>) : undefined,
    }))
    .filter((field) => field.key && field.label);
}

function parseFieldRows(formData: FormData): OfferingTypeField[] {
  const keys = formData.getAll("fieldKey").map((value) => String(value).trim());
  const labels = formData.getAll("fieldLabel").map((value) => String(value).trim());
  const types = formData.getAll("fieldType").map((value) => String(value).trim());
  const required = formData.getAll("fieldRequired").map((value) => String(value).trim());
  const options = formData.getAll("fieldOptions").map((value) => String(value).trim());

  return keys
    .map((fieldKey, index) => {
      const type = validFieldTypes.has(types[index]) ? (types[index] as OfferingTypeField["type"]) : "text";
      const optionValues =
        type === "select" || type === "multiselect" ? (options[index] ?? "").split(",").map((option) => option.trim()).filter(Boolean) : undefined;

      return {
        key: fieldKey,
        label: labels[index] ?? "",
        type,
        required: required[index] === "yes",
        options: optionValues,
        sortOrder: index,
        validationRules: optionValues?.length ? { allowed_values: optionValues } : {},
      };
    })
    .filter((field) => field.key && field.label);
}

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const key = String(formData.get("key") ?? "").trim();
  const fieldSchemaRaw = String(formData.get("fieldSchema") ?? "");
  const returnTo = getSafeAdminReturnTo(String(formData.get("returnTo") ?? ""));

  let fieldSchema: OfferingTypeField[];
  try {
    fieldSchema = formData.has("fieldKey") ? parseFieldRows(formData) : parseFieldSchema(fieldSchemaRaw);
  } catch {
    return respondError(request, {
      error: "invalid_field_definitions",
      message: "Trường dữ liệu không hợp lệ.",
      location: withQuery(returnTo, "error", "invalid_field_definitions"),
    });
  }

  try {
    await saveOfferingType({
      key,
      fieldSchema,
    });

    return respondSuccess(request, {
      location: withQuery(returnTo, "saved", key),
      message: "Đã lưu thay đổi.",
    });
  } catch (error) {
    return respondError(request, {
      error: error instanceof Error ? error.message : "save_failed",
      message: "Không thể lưu thay đổi.",
      location: withQuery(returnTo, "error", "save_failed"),
    });
  }
}

function getSafeAdminReturnTo(value: string) {
  return value.startsWith("/admin/") ? value : ROUTES.ADMIN.OFFERING_TYPES;
}

function withQuery(path: string, key: string, value: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${key}=${encodeURIComponent(value)}`;
}
