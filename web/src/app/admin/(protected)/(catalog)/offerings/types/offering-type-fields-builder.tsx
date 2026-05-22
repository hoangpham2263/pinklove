"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { OfferingTypeFieldType } from "@/features/offerings/types";

type FieldRow = {
  id: string;
  key: string;
  label: string;
  type: OfferingTypeFieldType;
  required: "yes" | "no";
  options: string;
};

const fieldTypes: OfferingTypeFieldType[] = ["text", "textarea", "number", "boolean", "select", "url", "date"];

const defaultRows: FieldRow[] = [
  { id: "duration_seconds", key: "duration_seconds", label: "Thời lượng video", type: "number", required: "yes", options: "" },
  { id: "video_style", key: "video_style", label: "Phong cách video", type: "select", required: "no", options: "cinematic, modern, minimal" },
  { id: "source_url", key: "source_url", label: "Link source", type: "url", required: "no", options: "" },
];

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

export function OfferingTypeFieldsBuilder() {
  const [rows, setRows] = useState<FieldRow[]>(defaultRows);

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
        <Button type="button" variant="outline" size="sm" onClick={() => setRows((current) => [...current, createRow()])}>
          <Plus className="mr-2 size-4" />
          Thêm field
        </Button>
      </div>

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div key={row.id} className="rounded-lg border bg-background p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-sm font-medium">Field {index + 1}</div>
              <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => removeRow(row.id)}>
                <Trash2 className="size-4" />
              </Button>
            </div>

            <div className="grid gap-3">
              <Input
                name="fieldKey"
                value={row.key}
                placeholder="field_key"
                pattern="[a-z][a-z0-9_]*"
                onChange={(event) => updateRow(row.id, { key: event.target.value })}
              />
              <Input
                name="fieldLabel"
                value={row.label}
                placeholder="Tên field"
                onChange={(event) => updateRow(row.id, { label: event.target.value })}
              />
              <div className="grid gap-3 sm:grid-cols-[1fr_92px]">
                <select
                  name="fieldType"
                  value={row.type}
                  className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
                  onChange={(event) => updateRow(row.id, { type: event.target.value as OfferingTypeFieldType })}
                >
                  {fieldTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <select
                  name="fieldRequired"
                  value={row.required}
                  className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
                  onChange={(event) => updateRow(row.id, { required: event.target.value as "yes" | "no" })}
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              {row.type === "select" ? (
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
