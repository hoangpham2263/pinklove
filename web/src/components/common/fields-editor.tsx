"use client";

import { Fragment, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TiptapRichTextEditor } from "@/components/common/tiptap-rich-text-editor";
import { MediaSelector } from "@/features/media/components/media-selector";
import type { FieldSchema } from "@/features/pages/schema";
import { cn } from "@/lib/utils";

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
  const [activeTab, setActiveTab] = useState(getFieldTabKey(fields[0], 0));

  if (fields.length === 0) {
    return null;
  }

  const resolvedActiveTab = fields.some((field, index) => getFieldTabKey(field, index) === activeTab)
    ? activeTab
    : getFieldTabKey(fields[0], 0);

  return (
    <div className="pt-4">
      <div className="overflow-x-auto border-b">
        <div className="flex min-w-max items-center gap-2">
          {fields.map((field, index) => {
            const tabKey = getFieldTabKey(field, index);
            const isActive = resolvedActiveTab === tabKey;

            return (
              <Button
                key={tabKey}
                type="button"
                variant="outline"
                className={cn(
                  "rounded-b-none rounded-t-sm border-border border-b-0",
                  isActive ? "bg-muted" : "hover:bg-muted"
                )}
                onClick={() => setActiveTab(tabKey)}
              >
                {getFieldTabLabel(field)}
              </Button>
            );
          })}
        </div>
      </div>

      {fields.map((field, index) => {
        const tabKey = getFieldTabKey(field, index);
        if (tabKey !== resolvedActiveTab) {
          return null;
        }

        return (
          <Fragment key={tabKey}>
            {renderField(field, values, onChange)}
          </Fragment>
        );
      })}
    </div>
  );
}

function renderField(
  field: FieldSchema,
  values: Record<string, unknown>,
  onChange?: (name: string, value: unknown) => void,
  options?: {
    compact?: boolean;
  }
) {
  if (field.type === "section") {
    const renderChild = (child: FieldSchema, index: number, childOptions = options) => (
      <div
        key={`${child.type}-${"name" in child ? child.name : child.label}-${index}`}
        className={getFieldWidthClass(child, childOptions)}
      >
        {renderField(child, values, onChange, childOptions)}
      </div>
    );

    return (
      <section className={options?.compact ? "space-y-4" : "rounded-b-xl border border-t-0"}>
        <div className={options?.compact ? "space-y-1" : "space-y-1 border-b p-4"}>
          <h3 className="font-semibold">{field.label}</h3>
          {field.description ? (
            <p className="text-sm text-muted-foreground">{field.description}</p>
          ) : null}
        </div>
        {field.layout === "two-columns" ? (
          <div className={cn("grid gap-6 lg:grid-cols-2", options?.compact ? "" : "p-4")}>
            <div className="grid grid-cols-12 content-start gap-4">
              {field.fields
                .filter((child) => child.column !== "right")
                .map((child, index) => renderChild(child, index, { compact: true }))}
            </div>
            <div className="grid grid-cols-12 content-start gap-4">
              {field.fields
                .filter((child) => child.column === "right")
                .map((child, index) => renderChild(child, index, { compact: true }))}
            </div>
          </div>
        ) : (
          <div className={cn("grid grid-cols-12 gap-4", options?.compact ? "" : "p-4")}>
            {field.fields.map((child, index) => renderChild(child, index, { compact: true }))}
          </div>
        )}
      </section>
    );
  }

  if (field.type === "repeater") {
    const items = Array.isArray(values[field.name])
      ? (values[field.name] as Record<string, unknown>[])
      : [];

    return (
      <section className={options?.compact ? "space-y-4" : "rounded-b-xl border border-t-0"}>
        <div className={options?.compact ? "space-y-4" : "space-y-4 p-4"}>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-semibold">{field.label}</h3>
              {field.description ? (
                <p className="text-sm text-muted-foreground">{field.description}</p>
              ) : null}
              <div className="text-sm text-muted-foreground">
                {items.length} item
              </div>
            </div>
            {onChange ? (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  onChange(field.name, [
                    ...items,
                    Object.fromEntries(field.fields.map((child) => [child.name, ""])),
                  ])
                }
              >
                {field.addLabel || "Thêm item"}
              </Button>
            ) : null}
          </div>

          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Chưa có dữ liệu.
            </div>
          ) : null}

          {items.map((item, itemIndex) => (
            <div
              key={`${field.name}-${itemIndex}`}
              className={cn(options?.compact ? "rounded-xl bg-muted/30 p-4" : "rounded-xl border")}
            >
              <div className={cn("flex items-center justify-between gap-4", options?.compact ? "mb-4" : "border-b p-4")}>
                <div className="space-y-1">
                  <p className="font-medium">
                    {field.label} #{itemIndex + 1}
                  </p>
                </div>
                {onChange ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      onChange(
                        field.name,
                        items.filter((_, index) => index !== itemIndex)
                      )
                    }
                  >
                    Xóa
                  </Button>
                ) : null}
              </div>
              <div className={cn("grid grid-cols-12 gap-4", options?.compact ? "" : "p-4")}>
                {field.fields.map((child) =>
                  renderLeafField(
                    child,
                    item,
                    onChange
                      ? (childName, value) => {
                          const nextItems = [...items];
                          nextItems[itemIndex] = {
                            ...item,
                            [childName]: value,
                          };
                          onChange(field.name, nextItems);
                        }
                      : undefined,
                    {
                      compact: true,
                    }
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return renderLeafField(field, values, onChange, options);
}

function renderLeafField(
  field: Extract<FieldSchema, { type: "text" | "textarea" | "media" | "wysiwyg" }>,
  values: Record<string, unknown>,
  onChange?: (name: string, value: unknown) => void,
  options?: {
    compact?: boolean;
  }
) {
  return (
    <div
      key={field.name}
      className={cn("space-y-2", getLeafWidthClass(field, options))}
    >
      <label className="font-medium">{field.label}</label>
      {field.description ? (
        <p className="text-sm text-muted-foreground">{field.description}</p>
      ) : null}
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
            compact
          />
        ) : (
          <Input
            name={field.name}
            defaultValue={String(values[field.name] ?? "")}
            placeholder={field.label}
          />
        )
      )}
      {field.type === "wysiwyg" && (
        <TiptapRichTextEditor
          name={field.name}
          initialValue={String(values[field.name] ?? "")}
          className="space-y-2"
          onChange={onChange ? (value) => onChange(field.name, value) : undefined}
        />
      )}
    </div>
  );
}

function getFieldTabKey(field?: FieldSchema, index = 0) {
  if (!field) {
    return "tab-0";
  }

  return `${field.type}-${"name" in field ? field.name : field.label}-${index}`;
}

function getFieldTabLabel(field: FieldSchema) {
  return field.label;
}

function getFieldWidthClass(
  field: FieldSchema,
  options?: {
    compact?: boolean;
  }
) {
  if (field.type === "section") {
    return "col-span-12";
  }

  if (field.type === "repeater") {
    return options?.compact ? getSchemaWidthClass(field.width ?? 12) : "col-span-12";
  }

  return getLeafWidthClass(field, options);
}

function getLeafWidthClass(
  field: Extract<FieldSchema, { type: "text" | "textarea" | "media" | "wysiwyg" }>,
  options?: {
    compact?: boolean;
  }
) {
  const width = field.width ?? (field.type === "textarea" && !options?.compact ? 12 : 6);

  return getSchemaWidthClass(width);
}

function getSchemaWidthClass(width: 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12) {
  switch (width) {
    case 2:
      return "col-span-12 md:col-span-6 lg:col-span-2";
    case 3:
      return "col-span-12 md:col-span-6 lg:col-span-3";
    case 4:
      return "col-span-12 lg:col-span-6 lg:col-span-4";
    case 5:
      return "col-span-12 lg:col-span-6 lg:col-span-5";
    case 6:
      return "col-span-12 md:col-span-6";
    case 7:
      return "col-span-12 lg:col-span-7";
    case 8:
      return "col-span-12 lg:col-span-8";
    case 9:
      return "col-span-12 lg:col-span-9";
    case 10:
      return "col-span-12 lg:col-span-10";
    case 11:
      return "col-span-12 lg:col-span-11";
    case 12:
    default:
      return "col-span-12";
  }
}
