"use client";

import { Fragment, useMemo, useState } from "react";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TiptapRichTextEditor } from "@/components/common/tiptap-rich-text-editor";
import { MediaSelector } from "@/features/media/components/media-selector";
import type { FieldSchema } from "@/features/pages/schema";
import { cn } from "@/lib/utils";

export type FieldsEditorOfferingOption = {
  value: string;
  label: string;
  description?: string;
};

type FieldsEditorProps = {
  fields: FieldSchema[];
  values: Record<string, unknown>;
  onChange?: (name: string, value: unknown) => void;
  offeringOptions?: FieldsEditorOfferingOption[];
  className?: string;
  showTabs?: boolean;
  forceSingleColumn?: boolean;
};

export function FieldsEditor({
  fields,
  values,
  onChange,
  offeringOptions = [],
  className = "pt-4",
  showTabs = true,
  forceSingleColumn = false,
}: FieldsEditorProps) {
  const [activeTab, setActiveTab] = useState(getFieldTabKey(fields[0], 0));

  if (fields.length === 0) {
    return null;
  }

  const resolvedActiveTab = fields.some((field, index) => getFieldTabKey(field, index) === activeTab)
    ? activeTab
    : getFieldTabKey(fields[0], 0);

  if (!showTabs) {
    return (
      <div className={className}>
        {fields.map((field, index) => (
          <div
            key={getFieldTabKey(field, index)}
            className={getFieldWidthClass(field, { compact: true, forceSingleColumn })}
          >
            {renderField(field, values, onChange, { compact: true, forceSingleColumn, offeringOptions })}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="admin-tab-scroll overflow-x-auto border-b">
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
            {renderField(field, values, onChange, { forceSingleColumn, offeringOptions })}
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
    forceSingleColumn?: boolean;
    offeringOptions?: FieldsEditorOfferingOption[];
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
        {field.layout === "two-columns" && !options?.forceSingleColumn ? (
          <div className={cn("grid gap-6 lg:grid-cols-2", options?.compact ? "" : "p-4")}>
            <div className="grid grid-cols-12 content-start gap-4">
              {field.fields
                .filter((child) => child.column !== "right")
                .map((child, index) => renderChild(child, index, { compact: true, forceSingleColumn: options?.forceSingleColumn, offeringOptions: options?.offeringOptions }))}
            </div>
            <div className="grid grid-cols-12 content-start gap-4">
              {field.fields
                .filter((child) => child.column === "right")
                .map((child, index) => renderChild(child, index, { compact: true, forceSingleColumn: options?.forceSingleColumn, offeringOptions: options?.offeringOptions }))}
            </div>
          </div>
        ) : (
          <div className={cn("grid grid-cols-12 gap-4", options?.compact ? "" : "p-4")}>
            {field.fields.map((child, index) => renderChild(child, index, { compact: true, forceSingleColumn: options?.forceSingleColumn, offeringOptions: options?.offeringOptions }))}
          </div>
        )}
      </section>
    );
  }

  if (field.type === "repeater") {
    return <RepeaterField field={field} values={values} onChange={onChange} options={options} />;
  }

  return renderLeafField(field, values, onChange, options);
}

function RepeaterField({
  field,
  values,
  onChange,
  options,
}: {
  field: Extract<FieldSchema, { type: "repeater" }>;
  values: Record<string, unknown>;
  onChange?: (name: string, value: unknown) => void;
  options?: {
    compact?: boolean;
    forceSingleColumn?: boolean;
    offeringOptions?: FieldsEditorOfferingOption[];
  };
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const items = Array.isArray(values[field.name])
    ? (values[field.name] as Record<string, unknown>[])
    : [];
  const itemIds = items.map((_, index) => getRepeaterItemId(field.name, index));

  const handleDragEnd = (event: DragEndEvent) => {
    if (!onChange) {
      return;
    }

    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = itemIds.findIndex((id) => id === active.id);
    const newIndex = itemIds.findIndex((id) => id === over.id);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    onChange(field.name, arrayMove(items, oldIndex, newIndex));
  };

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
              onClick={() => {
                const nextIndex = items.length;
                const nextItems = [
                  ...items,
                  Object.fromEntries(field.fields.map((child) => [child.name, ""])),
                ];

                onChange(field.name, nextItems);

                const firstFocusableChild = getFirstFocusableRepeaterChild(field.fields);
                if (!firstFocusableChild) {
                  return;
                }

                const focusPath = `${field.name}.${nextIndex}.${firstFocusableChild.name}`;
                focusRepeaterField(focusPath);
              }}
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

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {items.map((item, itemIndex) => (
                <SortableRepeaterItem
                  key={getRepeaterItemId(field.name, itemIndex)}
                  id={getRepeaterItemId(field.name, itemIndex)}
                  field={field}
                  item={item}
                  itemIndex={itemIndex}
                  items={items}
                  onChange={onChange}
                  options={options}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </section>
  );
}

function SortableRepeaterItem({
  id,
  field,
  item,
  itemIndex,
  items,
  onChange,
  options,
}: {
  id: string;
  field: Extract<FieldSchema, { type: "repeater" }>;
  item: Record<string, unknown>;
  itemIndex: number;
  items: Record<string, unknown>[];
  onChange?: (name: string, value: unknown) => void;
  options?: {
    compact?: boolean;
    forceSingleColumn?: boolean;
    offeringOptions?: FieldsEditorOfferingOption[];
  };
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        options?.compact ? "rounded-xl border border-dashed bg-muted/30 p-4" : "rounded-xl border bg-background",
        isDragging ? "relative z-10 opacity-80 shadow-md" : ""
      )}
    >
      <div className={cn("flex items-center justify-between gap-4", options?.compact ? "mb-4" : "border-b p-4")}>
        <div className="flex min-w-0 items-center gap-3">
          {onChange ? (
            <button
              type="button"
              aria-label={`Kéo để sắp xếp ${field.label} #${itemIndex + 1}`}
              className="inline-flex size-9 shrink-0 cursor-grab items-center justify-center rounded-md border bg-background text-muted-foreground transition hover:bg-muted active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="size-4" />
            </button>
          ) : null}
          <div className="space-y-1">
            <p className="font-medium">
              {field.label} #{itemIndex + 1}
            </p>
            {onChange ? (
              <p className="text-xs text-muted-foreground">Kéo biểu tượng để đổi thứ tự</p>
            ) : null}
          </div>
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
              forceSingleColumn: options?.forceSingleColumn,
              fieldPath: `${field.name}.${itemIndex}.${child.name}`,
              offeringOptions: options?.offeringOptions,
            }
          )
        )}
      </div>
    </div>
  );
}

function renderLeafField(
  field: Extract<FieldSchema, { type: "text" | "textarea" | "media" | "wysiwyg" | "switch" | "checkbox" | "offering-select" }>,
  values: Record<string, unknown>,
  onChange?: (name: string, value: unknown) => void,
  options?: {
    compact?: boolean;
    forceSingleColumn?: boolean;
    fieldPath?: string;
    offeringOptions?: FieldsEditorOfferingOption[];
  }
) {
  const fieldValue = values[field.name];

  return (
    <div
      key={field.name}
      data-field-path={options?.fieldPath}
      className={cn("space-y-2", getLeafWidthClass(field, options))}
    >
      <label className="font-medium">{field.label}</label>
      {field.description ? (
        <p className="text-sm text-muted-foreground">{field.description}</p>
      ) : null}
      {field.type === "text" && (
        onChange ? (
          <Input
            value={String(fieldValue ?? "")}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.label}
          />
        ) : (
          <Input
            name={field.name}
            defaultValue={String(fieldValue ?? "")}
            placeholder={field.label}
          />
        )
      )}
      {field.type === "switch" && (
        <SwitchField
          name={field.name}
          value={Boolean(fieldValue)}
          onChange={onChange ? (checked) => onChange(field.name, checked) : undefined}
        />
      )}
      {field.type === "checkbox" && (
        <CheckboxField
          name={field.name}
          value={Boolean(fieldValue)}
          onChange={onChange ? (checked) => onChange(field.name, checked) : undefined}
        />
      )}
      {field.type === "textarea" && (
        onChange ? (
          <textarea
            value={String(fieldValue ?? "")}
            onChange={(e) => onChange(field.name, e.target.value)}
            rows={field.rows}
            className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
            placeholder={field.label}
          />
        ) : (
          <textarea
            name={field.name}
            defaultValue={String(fieldValue ?? "")}
            rows={field.rows}
            className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
            placeholder={field.label}
          />
        )
      )}
      {field.type === "media" && (
        field.multiple ? (
          <MediaSelector
            name={onChange ? undefined : field.name}
            value={normalizeMediaValues(fieldValue)}
            onChange={(value) => onChange?.(field.name, value)}
            compact
            multiple
          />
        ) : (
          <MediaSelector
            name={onChange ? undefined : field.name}
            value={String(fieldValue ?? "")}
            onChange={(value) => onChange?.(field.name, value)}
            compact
          />
        )
      )}
      {field.type === "wysiwyg" && (
        <TiptapRichTextEditor
          name={field.name}
          initialValue={String(fieldValue ?? "")}
          className="space-y-2"
          onChange={onChange ? (value) => onChange(field.name, value) : undefined}
        />
      )}
      {field.type === "offering-select" && (
        <OfferingSelectField
          fieldName={field.name}
          multiple={field.multiple}
          value={fieldValue}
          onChange={onChange}
          options={options?.offeringOptions ?? []}
        />
      )}
    </div>
  );
}

function SwitchField({
  name,
  value,
  onChange,
}: {
  name: string;
  value: boolean;
  onChange?: (checked: boolean) => void;
}) {
  const [internalValue, setInternalValue] = useState(value);
  const isControlled = Boolean(onChange);
  const checked = isControlled ? value : internalValue;

  return (
    <div className="flex items-center gap-3 rounded-lg border px-3 py-2">
      {!isControlled && checked ? <input type="hidden" name={name} value="on" /> : null}
      <Switch
        checked={checked}
        onCheckedChange={(nextChecked) => {
          if (!isControlled) {
            setInternalValue(nextChecked);
          }
          onChange?.(nextChecked);
        }}
        aria-label={checked ? "Tắt" : "Bật"}
      />
      <span className="text-sm text-muted-foreground">{checked ? "Đang bật" : "Đang tắt"}</span>
    </div>
  );
}

function CheckboxField({
  name,
  value,
  onChange,
}: {
  name: string;
  value: boolean;
  onChange?: (checked: boolean) => void;
}) {
  const [internalValue, setInternalValue] = useState(value);
  const isControlled = Boolean(onChange);
  const checked = isControlled ? value : internalValue;

  return (
    <label className="inline-flex size-9 items-center justify-center rounded-md border">
      {!isControlled && checked ? <input type="hidden" name={name} value="on" /> : null}
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => {
          const nextChecked = event.target.checked;
          if (!isControlled) {
            setInternalValue(nextChecked);
          }
          onChange?.(nextChecked);
        }}
        className="size-4 rounded border-input text-primary outline-none"
      />
    </label>
  );
}

function getFirstFocusableRepeaterChild(
  fields: Extract<FieldSchema, { type: "text" | "textarea" | "media" | "wysiwyg" | "switch" | "checkbox" | "offering-select" }>[]
) {
  return fields.find((child) => child.type === "text" || child.type === "textarea" || child.type === "wysiwyg" || child.type === "media" || child.type === "offering-select" || child.type === "switch" || child.type === "checkbox");
}

function focusRepeaterField(fieldPath: string) {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const container = document.querySelector<HTMLElement>(`[data-field-path="${fieldPath}"]`);
      const focusTarget = container?.querySelector<HTMLElement>(
        'input, textarea, button, [contenteditable="true"], [role="textbox"]'
      );

      focusTarget?.focus();
    });
  });
}

function getRepeaterItemId(fieldName: string, index: number) {
  return `${fieldName}-item-${index}`;
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
    forceSingleColumn?: boolean;
  }
) {
  if (options?.forceSingleColumn) {
    return "col-span-12";
  }

  if (field.type === "section") {
    return "col-span-12";
  }

  if (field.type === "repeater") {
    return options?.compact ? getSchemaWidthClass(field.width ?? 12) : "col-span-12";
  }

  return getLeafWidthClass(field, options);
}

function getLeafWidthClass(
  field: Extract<FieldSchema, { type: "text" | "textarea" | "media" | "wysiwyg" | "switch" | "checkbox" | "offering-select" }>,
  options?: {
    compact?: boolean;
    forceSingleColumn?: boolean;
  }
) {
  if (options?.forceSingleColumn) {
    return "col-span-12";
  }

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

function normalizeMediaValues(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return [value];
  }

  return [];
}

function normalizeStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return [value];
  }

  return [];
}

function OfferingSelectField({
  fieldName,
  multiple,
  value,
  onChange,
  options,
}: {
  fieldName: string;
  multiple?: boolean;
  value: unknown;
  onChange?: (name: string, value: unknown) => void;
  options: FieldsEditorOfferingOption[];
}) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const selectedValues = normalizeStringArray(value);

  const availableOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    const selectedSet = new Set(selectedValues);

    return options.filter((option) => {
      if (selectedSet.has(option.value)) {
        return false;
      }

      if (!query) {
        return true;
      }

      return `${option.label} ${option.description ?? ""}`.toLowerCase().includes(query);
    });
  }, [options, search, selectedValues]);

  const selectedOptions = useMemo(() => {
    const optionMap = new Map(options.map((option) => [option.value, option] as const));

    return selectedValues
      .map((item) => optionMap.get(item))
      .filter((item): item is FieldsEditorOfferingOption => Boolean(item));
  }, [options, selectedValues]);

  function addOffering(offeringValue: string) {
    if (!onChange) {
      return;
    }

    const next = multiple
      ? [...selectedValues, offeringValue].filter((item, index, array) => array.indexOf(item) === index)
      : [offeringValue];

    onChange(fieldName, next);
  }

  function removeOffering(offeringValue: string) {
    if (!onChange) {
      return;
    }

    onChange(
      fieldName,
      selectedValues.filter((item) => item !== offeringValue)
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!onChange || !multiple) {
      return;
    }

    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = selectedValues.indexOf(String(active.id));
    const newIndex = selectedValues.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    onChange(fieldName, arrayMove(selectedValues, oldIndex, newIndex));
  }

  return (
    <div className="space-y-3">
      <div className="rounded-md border bg-card p-3">
        {selectedOptions.length === 0 ? (
          <p className="mb-3 text-sm text-muted-foreground">Chưa chọn sản phẩm nào.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={selectedOptions.map((option) => option.value)}
              strategy={verticalListSortingStrategy}
            >
              <div className="mb-3 flex max-h-48 flex-col gap-2 overflow-y-auto pr-1">
                {selectedOptions.map((option) => (
                  <SortableOfferingOption
                    key={option.value}
                    option={option}
                    sortable={Boolean(onChange && multiple && selectedOptions.length > 1)}
                    onRemove={() => removeOffering(option.value)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger
            render={
              <Button type="button" variant="outline" className="w-full border-dashed" onClick={() => setSearch("")}>
                <Plus className="mr-2 size-4" />
                Thêm sản phẩm
              </Button>
            }
          />
          <DialogContent className="flex h-[min(42rem,calc(100vh-2rem))] w-[min(44rem,calc(100vw-2rem))] max-w-none grid-rows-none flex-col gap-0 overflow-hidden p-0">
            <div className="shrink-0 p-6 pb-4">
              <DialogHeader>
                <DialogTitle>Chọn sản phẩm</DialogTitle>
              </DialogHeader>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm sản phẩm..."
                  className="pl-9"
                  autoFocus
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
              <div className="flex flex-col gap-2">
                {availableOptions.length === 0 ? (
                  <div className="flex h-full min-h-72 items-center justify-center rounded-md border border-dashed text-center text-sm text-muted-foreground">
                    Không tìm thấy sản phẩm phù hợp.
                  </div>
                ) : (
                  availableOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className="flex min-h-16 cursor-pointer items-center justify-between gap-3 rounded-md border bg-card p-3 text-left transition-colors hover:bg-accent/50"
                      onClick={() => addOffering(option.value)}
                    >
                      <span className="flex min-w-0 flex-col gap-1">
                        <span className="truncate font-medium">{option.label}</span>
                        {option.description ? (
                          <span className="truncate text-xs text-muted-foreground">{option.description}</span>
                        ) : null}
                      </span>
                      <span className="shrink-0 rounded-md border px-3 py-1.5 text-xs font-medium">
                        Chọn
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-between border-t bg-muted/20 p-4">
              <span className="text-sm text-muted-foreground">
                Đã chọn {selectedValues.length} sản phẩm
              </span>
              <Button type="button" onClick={() => setIsOpen(false)}>Xong</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function SortableOfferingOption({
  option,
  sortable,
  onRemove,
}: {
  option: FieldsEditorOfferingOption;
  sortable: boolean;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: option.value,
    disabled: !sortable,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "flex items-center gap-2 rounded-md border bg-secondary/30 px-2 py-2 text-sm transition-colors hover:bg-secondary/50",
        isDragging ? "relative z-10 opacity-80 shadow-md" : ""
      )}
    >
      {sortable ? (
        <button
          type="button"
          className="inline-flex size-8 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-background active:cursor-grabbing"
          aria-label={`Kéo để sắp xếp ${option.label}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
      ) : null}
      <span className="min-w-0 flex-1 space-y-0.5 px-1">
        <span className="block truncate font-medium">{option.label}</span>
        {option.description ? (
          <span className="block truncate text-xs text-muted-foreground">{option.description}</span>
        ) : null}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
        aria-label={`Bỏ ${option.label}`}
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
