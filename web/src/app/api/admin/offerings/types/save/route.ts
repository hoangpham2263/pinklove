import { saveOfferingType } from "@/features/offerings/server/service";
import type { OfferingFulfillmentType, OfferingTypeField } from "@/features/offerings/types";
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
      const optionValues = type === "select" ? (options[index] ?? "").split(",").map((option) => option.trim()).filter(Boolean) : undefined;

      return {
        key: fieldKey,
        label: labels[index] ?? "",
        type,
        required: required[index] === "yes",
        options: optionValues,
      };
    })
    .filter((field) => field.key && field.label);
}

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const key = String(formData.get("key") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "active") as "draft" | "active" | "archived";
  const fulfillmentType = String(formData.get("fulfillmentType") ?? "digital") as OfferingFulfillmentType;
  const templateKey = String(formData.get("templateKey") ?? "").trim();
  const supportsInventory = formData.get("supportsInventory") === "on";
  const supportsVendorSupply = formData.get("supportsVendorSupply") === "on";
  const fieldSchemaRaw = String(formData.get("fieldSchema") ?? "");

  let fieldSchema: OfferingTypeField[];
  try {
    fieldSchema = formData.has("fieldKey") ? parseFieldRows(formData) : parseFieldSchema(fieldSchemaRaw);
  } catch {
    return respondError(request, {
      error: "invalid_field_schema",
      message: "Field schema phải là JSON array hợp lệ.",
      location: `${ROUTES.ADMIN.OFFERING_TYPES}?error=invalid_field_schema`,
    });
  }

  try {
    await saveOfferingType({
      key,
      label,
      description,
      status,
      fulfillmentType,
      templateKey: templateKey || key,
      supportsInventory,
      supportsVendorSupply,
      fieldSchema,
    });

    return respondSuccess(request, {
      location: `${ROUTES.ADMIN.OFFERING_TYPES}?saved=${encodeURIComponent(key)}`,
      message: "Đã lưu loại offering.",
    });
  } catch (error) {
    return respondError(request, {
      error: error instanceof Error ? error.message : "save_failed",
      message: "Không thể lưu loại offering.",
      location: `${ROUTES.ADMIN.OFFERING_TYPES}?error=save_failed`,
    });
  }
}
