"use client";

import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { AdminTableActionButton } from "@/features/admin/components/admin-table-actions";
import type { MenuItem } from "@/lib/menu";

export type EditableMenuItem = Omit<MenuItem, "menuId">;

export type MenuParentOption = {
  id: string;
  label: string;
  depth: number;
};

const INDENT_THRESHOLD = 24;

export function getMenuItemMeta(item: EditableMenuItem) {
  if (item.type === "page") {
    const slug = item.pageSlug ?? "";
    return {
      typeLabel: "Page",
      value: slug.startsWith("/") ? slug : `/${slug}`,
    };
  }

  return {
    typeLabel: "Custom",
    value: item.url ?? "",
  };
}

function SortableMenuItem({
  item,
  index,
  depth,
  parentOptions,
  onOpenEdit,
  onUpdateParent,
  onRemove,
}: {
  item: EditableMenuItem;
  index: number;
  depth: number;
  parentOptions: MenuParentOption[];
  onOpenEdit: (itemId: string) => void;
  onUpdateParent: (itemId: string, parentId: string | null) => void;
  onRemove: (index: number) => void;
}) {
  const sortableId = item.id || `new-${index}`;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sortableId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginLeft: `${depth * 50}px`,
    width: `calc(100% - ${depth * 50}px)`,
  };
  const meta = getMenuItemMeta(item);

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between gap-3 rounded-md border bg-card px-3 py-2${isDragging ? " opacity-70 shadow-md" : ""}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
        <button
          type="button"
          className="cursor-grab shrink-0 text-muted-foreground active:cursor-grabbing"
          aria-label={`Kéo để sắp xếp ${item.label}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex flex-1 flex-row items-center gap-5">
          <p className="min-w-25 font-medium">{item.label}</p>
          <p className="flex min-w-0 items-center gap-1 text-sm">
            <span className="shrink-0">{meta.typeLabel}:</span>
            <span className="truncate">{meta.value}</span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <select
          value={item.parentId ?? ""}
          onChange={(event) => onUpdateParent(item.id, event.target.value || null)}
          className="h-7.5 w-44 rounded-md border px-3"
        >
          <option value="">Gốc</option>
          {parentOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {"— ".repeat(option.depth)}
              {option.label}
            </option>
          ))}
        </select>
        <AdminTableActionButton action="edit" label="Sửa menu item" onClick={() => onOpenEdit(item.id)} />
        <AdminTableActionButton action="delete" label="Xóa menu item" onClick={() => onRemove(index)} />
      </div>
    </li>
  );
}

export function MenuSortableList({
  items,
  itemDepths,
  parentOptionsByItemId,
  onOpenEdit,
  onUpdateParent,
  onChange,
  onRemove,
}: {
  items: EditableMenuItem[];
  itemDepths: Record<string, number>;
  parentOptionsByItemId: Record<string, MenuParentOption[]>;
  onOpenEdit: (itemId: string) => void;
  onUpdateParent: (itemId: string, parentId: string | null) => void;
  onChange: (items: EditableMenuItem[]) => void;
  onRemove: (index: number) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const normalizePositions = (nextItems: EditableMenuItem[]) =>
    nextItems.map((item, index) => ({
      ...item,
      position: index,
    }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item, index) => (item.id || `new-${index}`) === active.id);
    const newIndex = items.findIndex((item, index) => (item.id || `new-${index}`) === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reorderedItems = normalizePositions(arrayMove(items, oldIndex, newIndex));
    const movedItem = reorderedItems[newIndex];
    if (!movedItem) {
      onChange(reorderedItems);
      return;
    }

    const previousItem = reorderedItems[newIndex - 1] ?? null;
    const allowedParentIds = new Set((parentOptionsByItemId[movedItem.id] ?? []).map((option) => option.id));

    let nextParentId = movedItem.parentId ?? null;

    if (event.delta.x > INDENT_THRESHOLD && previousItem && allowedParentIds.has(previousItem.id)) {
      nextParentId = previousItem.id;
    } else if (event.delta.x < -INDENT_THRESHOLD) {
      if (movedItem.parentId) {
        const currentParent = reorderedItems.find((item) => item.id === movedItem.parentId) ?? null;
        nextParentId = currentParent?.parentId ?? null;
      } else {
        nextParentId = null;
      }
    }

    reorderedItems[newIndex] = {
      ...movedItem,
      parentId: nextParentId,
    };

    onChange(normalizePositions(reorderedItems));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={items.map((item, index) => item.id || `new-${index}`)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="space-y-2">
          {items.map((item, index) => (
            <SortableMenuItem
              key={item.id || `new-${index}`}
              item={item}
              index={index}
              depth={itemDepths[item.id] ?? 0}
              parentOptions={parentOptionsByItemId[item.id] ?? []}
              onOpenEdit={onOpenEdit}
              onUpdateParent={onUpdateParent}
              onRemove={onRemove}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
