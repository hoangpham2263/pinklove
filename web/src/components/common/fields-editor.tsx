"use client";

import { Input } from "@/components/ui/input";
import { MediaSelector } from "@/features/media/components/media-selector";
import type { FieldSchema } from "@/features/pages/schema";

type FieldsEditorProps = {
  fields: FieldSchema[];
  values: Record<string, unknown>;
  onChange?: (name: string, value: unknown) => void;
};

export function FieldsEditor({
  fields,
  values,
  onChange,
}: FieldsEditorProps) {
  return (
    <div className="grid gap-4 pt-4 md:grid-cols-2">
      {fields.map((field) => (
        <div
          key={field.name}
          className={`space-y-2 ${field.type === "textarea" ? "md:col-span-2" : ""}`}
        >
          <label className="font-medium">{field.label}</label>
          {field.type === "text" && (
            onChange ? (
              <Input
                value={String(values[field.name] ?? "")}
                onChange={(e) => onChange(field.name, e.target.value)}
                placeholder={field.label}
              />
            ) : (
              <Input
                name={field.name}
                defaultValue={String(values[field.name] ?? "")}
                placeholder={field.label}
              />
            )
          )}
          {field.type === "textarea" && (
            onChange ? (
              <textarea
                value={String(values[field.name] ?? "")}
                onChange={(e) => onChange(field.name, e.target.value)}
                className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder={field.label}
              />
            ) : (
              <textarea
                name={field.name}
                defaultValue={String(values[field.name] ?? "")}
                className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder={field.label}
              />
            )
          )}
          {field.type === "media" && (
            onChange ? (
              <MediaSelector
                value={String(values[field.name] ?? "")}
                onChange={(value) => onChange(field.name, value)}
              />
            ) : (
              <Input
                name={field.name}
                defaultValue={String(values[field.name] ?? "")}
                placeholder={field.label}
              />
            )
          )}
        </div>
      ))}
    </div>
  );
}
