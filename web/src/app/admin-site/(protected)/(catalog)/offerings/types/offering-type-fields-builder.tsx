"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AdminIconButton, AdminOutlineButton } from "@/features/admin/components/admin-buttons";
import {
  OFFERING_TYPE_FIELD_TYPES,
  type OfferingTypeField,
  type OfferingTypeFieldType,
} from "@/features/offerings/types";
import { slugify } from "@/lib/utils";

type FieldRow = {
  id: string;
  key: string;
  label: string;
  type: OfferingTypeFieldType;
  required: "yes" | "no";
  options: string;
};

function createRow(): FieldRow {
  return {
    id: crypto.randomUUID(),
    key: "",
    label: "",
    type: "text",
    required: "no",
    options: "",
  };
}

function fieldToRow(field: OfferingTypeField): FieldRow {
  const allowedValues = Array.isArray(field.validationRules?.allowed_values)
    ? field.validationRules.allowed_values.map(String)
    : field.options ?? [];

  return {
    id: field.id ?? field.key,
    key: field.key,
    label: field.label,
    type: field.type,
    required: field.required ? "yes" : "no",
    options: allowedValues.join(", "),
  };
}

export function OfferingTypeFieldsBuilder({
  initialFields,
}: {
  initialFields?: OfferingTypeField[];
}) {
  const initialRows = useMemo(() => {
    if (initialFields?.length) {
      return initialFields.map(fieldToRow);
    }
    return [createRow()];
  }, [initialFields]);
  const [rows, setRows] = useState<FieldRow[]>(initialRows);

  const updateRow = (id: string, patch: Partial<FieldRow>) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const removeRow = (id: string) => {
    setRows((current) => (current.length > 1 ? current.filter((row) => row.id !== id) : [createRow()]));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="font-medium">Fields</label>
        <AdminOutlineButton type="button" size="sm" onClick={() => setRows((current) => [...current, createRow()])}>
          <Plus className="mr-2 size-4" />
          Thêm field
        </AdminOutlineButton>
      </div>

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div key={row.id} className="rounded-lg border bg-background p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-sm font-medium">Field {index + 1}</div>
              <AdminIconButton type="button" className="size-8" onClick={() => removeRow(row.id)}>
                <Trash2 className="size-4" />
              </AdminIconButton>
            </div>

            <div className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  name="fieldLabel"
                  value={row.label}
                  placeholder="Tên field"
                  onChange={(event) => {
                    const nextLabel = event.target.value;
                    updateRow(row.id, {
                      label: nextLabel,
                      key: slugify(nextLabel).replace(/-/g, '_')
                    });
                  }}
                />
                <Input
                  name="fieldKey"
                  value={row.key}
                  placeholder="field_key"
                  pattern="[a-z][a-z0-9_]*"
                  onChange={(event) => updateRow(row.id, { key: event.target.value })}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  name="fieldType"
                  value={row.type}
                  className="h-10 w-full rounded-md border bg-background pl-3 pr-8 py-2 text-sm outline-none"
                  onChange={(event) => updateRow(row.id, { type: event.target.value as OfferingTypeFieldType })}
                >
                  {OFFERING_TYPE_FIELD_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <select
                  name="fieldRequired"
                  value={row.required}
                  className="h-10 w-full rounded-md border bg-background pl-3 pr-8 py-2 text-sm outline-none"
                  onChange={(event) => updateRow(row.id, { required: event.target.value as "yes" | "no" })}
                >
                  <option value="no">Không bắt buộc</option>
                  <option value="yes">Bắt buộc</option>
                </select>
              </div>
              {row.type === "select" || row.type === "multiselect" ? (
                <Input
                  name="fieldOptions"
                  value={row.options}
                  placeholder="Option 1, Option 2, Option 3"
                  onChange={(event) => updateRow(row.id, { options: event.target.value })}
                />
              ) : (
                <input type="hidden" name="fieldOptions" value="" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
