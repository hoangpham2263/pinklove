"use client";

import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MenuItem } from "@/lib/menu";

export type EditableMenuItem = Omit<MenuItem, "menuId">;

function SortableMenuItem({
  item,
  index,
  onRemove,
}: {
  item: EditableMenuItem;
  index: number;
  onRemove: (index: number) => void;
}) {
  const sortableId = item.id || `new-${index}`;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sortableId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between rounded-md border bg-card p-3${isDragging ? " opacity-70 shadow-md" : ""}`}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <button
          type="button"
          className="cursor-grab shrink-0 text-muted-foreground active:cursor-grabbing"
          aria-label={`Kéo để sắp xếp ${item.label}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="truncate">
          <p className="truncate font-medium">{item.label}</p>
          <p className="truncate opacity-70">
            {item.type === "page" ? `Page: /${item.pageSlug}` : `Custom: ${item.url}`}
            {item.parentId ? " • Cấp 2" : " • Cấp 1"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:bg-destructive/10"
          onClick={() => onRemove(index)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );
}

export function MenuSortableList({
  items,
  onChange,
  onRemove,
}: {
  items: EditableMenuItem[];
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

    onChange(normalizePositions(arrayMove(items, oldIndex, newIndex)));
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
              onRemove={onRemove}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
