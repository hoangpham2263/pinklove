"use client";

import { Input } from "@/components/ui/input";
import { MediaSelector } from "@/features/media/components/media-selector";
import type { OfferingTypeDefinition, OfferingTypeField } from "@/features/offerings/types";

type DynamicOfferingFieldsProps = {
  offeringType: OfferingTypeDefinition;
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
};

function conditionPasses(condition: Record<string, unknown>, values: Record<string, unknown>) {
  const fieldKey = String(condition.field ?? condition.fieldKey ?? "");
  const operator = String(condition.operator ?? "equals");
  const expected = condition.value;
  const actual = values[fieldKey];

  switch (operator) {
    case "not_equals":
      return actual !== expected;
    case "in":
      return Array.isArray(expected) && expected.includes(actual);
    case "not_empty":
      return actual !== undefined && actual !== null && String(actual).trim() !== "";
    case "empty":
      return actual === undefined || actual === null || String(actual).trim() === "";
    case "equals":
    default:
      return actual === expected;
  }
}

function isVisible(field: OfferingTypeField, values: Record<string, unknown>) {
  const conditions = field.visibilityConditions ?? {};
  const allConditions =
    Array.isArray(conditions.all) ? conditions.all :
    Array.isArray(conditions.conditions) ? conditions.conditions :
    [];

  return allConditions.every((condition) =>
    !condition || typeof condition !== "object" ? true : conditionPasses(condition as Record<string, unknown>, values)
  );
}

function getInputType(type: OfferingTypeField["type"]) {
  switch (type) {
    case "number":
    case "price":
      return "number";
    case "date":
      return "date";
    case "datetime":
      return "datetime-local";
    case "url":
    case "media":
      return "url";
    default:
      return "text";
  }
}

function normalizeStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

function renderField(
  field: OfferingTypeField,
  values: Record<string, unknown>,
  onChange: (values: Record<string, unknown>) => void
) {
  const value = values[field.key] ?? field.defaultValue ?? "";
  const setValue = (nextValue: unknown) => onChange({ ...values, [field.key]: nextValue });
  const required = Boolean(field.required || field.validationRules?.required);

  if (field.type === "textarea" || field.type === "richtext") {
    return (
      <textarea
        id={`field-${field.key}`}
        value={String(value)}
        required={required}
        placeholder={field.placeholder}
        onChange={(event) => setValue(event.target.value)}
        className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
      />
    );
  }

  if (field.type === "boolean") {
    return (
      <label className="flex h-10 items-center gap-2 rounded-md border bg-card px-3 text-sm">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => setValue(event.target.checked)}
          className="rounded border-input"
        />
        Có
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <select
        id={`field-${field.key}`}
        value={String(value)}
        required={required}
        onChange={(event) => setValue(event.target.value)}
        className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
      >
        <option value="">Chọn</option>
        {(field.options ?? []).map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    );
  }

  if (field.type === "multiselect") {
    const selected = normalizeStringArray(value);
    return (
      <select
        id={`field-${field.key}`}
        multiple
        value={selected}
        required={required}
        onChange={(event) => setValue(Array.from(event.target.selectedOptions).map((option) => option.value))}
        className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
      >
        {(field.options ?? []).map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    );
  }

  if (field.type === "media") {
    return (
      <MediaSelector
        value={String(value ?? "")}
        onChange={setValue}
        compact
      />
    );
  }

  if (field.type === "gallery") {
    return (
      <MediaSelector
        value={normalizeStringArray(value)}
        onChange={setValue}
        compact
        multiple
      />
    );
  }

  if (field.type === "relation") {
    if (field.relationMultiple) {
      return (
        <Input
          id={`field-${field.key}`}
          value={normalizeStringArray(value).join(", ")}
          required={required}
          placeholder={field.placeholder ?? `ID ${field.relationTarget ?? "relation"}, phân tách bằng dấu phẩy`}
          onChange={(event) => setValue(normalizeStringArray(event.target.value))}
        />
      );
    }

    return (
      <Input
        id={`field-${field.key}`}
        value={String(value ?? "")}
        required={required}
        placeholder={field.placeholder ?? `ID ${field.relationTarget ?? "relation"}`}
        onChange={(event) => setValue(event.target.value)}
      />
    );
  }

  if (field.type === "json" || field.type === "repeater" || field.type === "blocks") {
    const fallbackValue = field.type === "repeater" || field.type === "blocks" ? [] : {};
    const textValue = typeof value === "string" ? value : JSON.stringify(value || fallbackValue, null, 2);
    return (
      <textarea
        id={`field-${field.key}`}
        value={textValue}
        required={required}
        onChange={(event) => {
          const nextValue = event.target.value;
          try {
            setValue(nextValue.trim() ? JSON.parse(nextValue) : fallbackValue);
          } catch {
            setValue(nextValue);
          }
        }}
        className="min-h-28 w-full rounded-md border bg-background px-3 py-2 font-mono text-xs outline-none"
      />
    );
  }

  return (
    <Input
      id={`field-${field.key}`}
      type={getInputType(field.type)}
      value={String(value)}
      required={required}
      placeholder={field.placeholder}
      min={field.validationRules?.min !== undefined ? String(field.validationRules.min) : undefined}
      max={field.validationRules?.max !== undefined ? String(field.validationRules.max) : undefined}
      pattern={field.validationRules?.regex !== undefined ? String(field.validationRules.regex) : undefined}
      onChange={(event) => setValue(field.type === "number" || field.type === "price" ? Number(event.target.value || "0") : event.target.value)}
    />
  );
}

export function DynamicOfferingFields({ offeringType, values, onChange }: DynamicOfferingFieldsProps) {
  const visibleFields = offeringType.fieldSchema.filter((field) => isVisible(field, values));

  if (visibleFields.length === 0) {
    return null;
  }

  const groups = offeringType.fieldGroups?.length
    ? offeringType.fieldGroups
    : [{ id: "default", key: "default", label: `Fields của ${offeringType.label}`, sortOrder: 0 }];

  return (
    <div className="space-y-5 md:col-span-2">
      {groups.map((group) => {
        const fields = visibleFields.filter((field) =>
          group.id === "default" ? !field.groupId : field.groupId === group.id || field.groupId === group.key
        );

        if (fields.length === 0) {
          return null;
        }

        // Chunking fields into rows (max 2 per row, unless full-width)
        const rows: OfferingTypeField[][] = [];
        let currentRow: OfferingTypeField[] = [];

        fields.forEach((field) => {
          const isFullWidth = ["textarea", "richtext", "json", "repeater", "blocks", "gallery"].includes(field.type);

          if (isFullWidth) {
            if (currentRow.length > 0) {
              rows.push(currentRow);
              currentRow = [];
            }
            rows.push([field]);
          } else {
            currentRow.push(field);
            if (currentRow.length === 2) {
              rows.push(currentRow);
              currentRow = [];
            }
          }
        });

        if (currentRow.length > 0) {
          rows.push(currentRow);
        }

        return (
          <section key={group.id ?? group.key} className="space-y-5 rounded-md border p-4">
            <h3 className="font-semibold text-lg border-b pb-2">{group.label}</h3>
            <div className="space-y-5">
              {rows.map((row, rowIndex) => (
                <div key={rowIndex} className="grid gap-5 grid-cols-1">
                  {row.map((field) => {
                    const isFullWidth = ["textarea", "richtext", "json", "repeater", "blocks", "gallery"].includes(field.type);
                    return (
                      <div
                        key={field.key}
                        className={isFullWidth ? "space-y-2 md:col-span-2" : "space-y-2"}
                      >
                        <label htmlFor={`field-${field.key}`} className="font-medium text-sm">
                          {field.label}
                        </label>
                        {renderField(field, values, onChange)}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
