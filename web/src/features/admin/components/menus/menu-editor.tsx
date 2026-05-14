"use client";

import dynamic from "next/dynamic";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AdminCreateButton, AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { AdminTableActionButton } from "@/features/admin/components/admin-table-actions";
import { adminApi } from "@/lib/api-client.admin";
import { Menu, MenuItemType } from "@/lib/menu";
import { ManagedPage } from "@/lib/managed-pages";
import { getManagedPagePath } from "@/lib/page-paths";
import { GripVertical } from "lucide-react";
import { getMenuItemMeta, type EditableMenuItem, type MenuParentOption } from "./menu-sortable-list";

type MenuEditorProps = {
  menu: Menu;
  availablePages: ManagedPage[];
};

const MenuSortableList = dynamic(
  () => import("./menu-sortable-list").then((module) => module.MenuSortableList),
  {
    ssr: false,
    loading: () => null,
  }
);

export function MenuEditor({ menu, availablePages }: MenuEditorProps) {
  const [items, setItems] = useState<EditableMenuItem[]>(
    menu.items.map((item) => ({ ...item }))
  );
  const router = useRouter();
  const itemsRef = useRef<EditableMenuItem[]>(menu.items.map((item) => ({ ...item })));
  const serializedItemsRef = useRef<HTMLInputElement>(null);
  const nextTempIdRef = useRef(0);
  const [isSaving, setIsSaving] = useState(false);

  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<MenuItemType>("page");
  const [newPageSlug, setNewPageSlug] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newParentId, setNewParentId] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const normalizePositions = (nextItems: EditableMenuItem[]) =>
    nextItems.map((item, i) => ({
      ...item,
      position: i,
    }));

  const buildChildrenMap = (sourceItems: EditableMenuItem[]) => {
    const map = new Map<string | null, EditableMenuItem[]>();

    for (const item of sourceItems) {
      const key = item.parentId ?? null;
      const bucket = map.get(key) ?? [];
      bucket.push(item);
      map.set(key, bucket);
    }

    return map;
  };

  const flattenItems = (sourceItems: EditableMenuItem[]) => {
    const childrenMap = buildChildrenMap(sourceItems);
    const ordered: EditableMenuItem[] = [];
    const depths: Record<string, number> = {};
    const visited = new Set<string>();

    const visit = (parentId: string | null, depth: number) => {
      const children = childrenMap.get(parentId) ?? [];
      for (const child of children) {
        if (visited.has(child.id)) continue;
        visited.add(child.id);
        depths[child.id] = depth;
        ordered.push(child);
        visit(child.id, depth + 1);
      }
    };

    visit(null, 0);

    for (const item of sourceItems) {
      if (visited.has(item.id)) continue;
      depths[item.id] = 0;
      ordered.push(item);
    }

    return {
      items: normalizePositions(ordered),
      depths,
    };
  };

  const getDescendantIds = (sourceItems: EditableMenuItem[], itemId: string) => {
    const descendants = new Set<string>();
    const queue = [itemId];

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId) continue;

      for (const item of sourceItems) {
        if (item.parentId !== currentId || descendants.has(item.id)) continue;
        descendants.add(item.id);
        queue.push(item.id);
      }
    }

    return descendants;
  };

  const buildParentOptions = (sourceItems: EditableMenuItem[], excludeId?: string) => {
    const { items: flattened, depths } = flattenItems(sourceItems);
    const excludedIds = excludeId ? getDescendantIds(sourceItems, excludeId) : new Set<string>();
    if (excludeId) excludedIds.add(excludeId);

    return flattened
      .filter((item) => !excludedIds.has(item.id))
      .map((item) => ({
        id: item.id,
        label: item.label,
        depth: depths[item.id] ?? 0,
      })) satisfies MenuParentOption[];
  };

  const parentOptions = buildParentOptions(items);
  const { items: orderedItems, depths: itemDepths } = flattenItems(items);
  const parentOptionsByItemId = Object.fromEntries(
    orderedItems.map((item) => [item.id, buildParentOptions(items, item.id)])
  ) as Record<string, MenuParentOption[]>;
  const editingItem = editingItemId ? orderedItems.find((item) => item.id === editingItemId) ?? null : null;
  const editingParentOptions = editingItem ? parentOptionsByItemId[editingItem.id] ?? [] : [];

  const setOrderedItems = (nextItems: EditableMenuItem[]) => {
    const normalizedItems = flattenItems(nextItems).items;
    itemsRef.current = normalizedItems;
    setItems(normalizedItems);
  };

  const updateItemParent = (itemId: string, parentId: string | null) => {
    setOrderedItems(
      itemsRef.current.map((item) => (
        item.id === itemId
          ? {
            ...item,
            parentId,
          }
          : item
      ))
    );
  };

  const updateItemFields = (itemId: string, next: Partial<EditableMenuItem>) => {
    setOrderedItems(
      itemsRef.current.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        const nextType = (next.type ?? item.type) as MenuItemType;

        return {
          ...item,
          ...next,
          type: nextType,
          pageSlug: nextType === "page" ? (next.pageSlug ?? item.pageSlug ?? null) : null,
          url: nextType === "custom" ? (next.url ?? item.url ?? null) : null,
        };
      })
    );
  };

  const handleAddItem = () => {
    if (!newLabel.trim()) return;
    if (newType === "page" && !newPageSlug) return;
    if (newType === "custom" && !newUrl.trim()) return;
    const nextTempId = `new-${nextTempIdRef.current}`;
    nextTempIdRef.current += 1;

    setOrderedItems([
      ...itemsRef.current,
      {
        id: nextTempId,
        parentId: newParentId || null,
        type: newType,
        label: newLabel,
        pageSlug: newType === "page" ? newPageSlug : null,
        url: newType === "custom" ? newUrl : null,
        position: items.length,
      },
    ]);

    setNewLabel("");
    setNewPageSlug("");
    setNewUrl("");
    setNewParentId("");
  };

  const handleRemoveItem = (index: number) => {
    const targetItem = orderedItems[index];
    if (!targetItem) return;
    const descendants = getDescendantIds(itemsRef.current, targetItem.id);
    const nextItems = itemsRef.current.filter((item) => item.id !== targetItem.id && !descendants.has(item.id));
    setOrderedItems(nextItems);
    toast.success(descendants.size > 0 ? "Đã xóa menu item và các mục con khỏi bản nháp." : "Đã xóa menu item khỏi bản nháp.");
  };

  const serializeItems = (sourceItems: EditableMenuItem[]) => {
    const { items: normalizedItems } = flattenItems(sourceItems);
    return JSON.stringify(
      normalizedItems.map((item, i) => ({
        id: item.id,
        label: item.label,
        type: item.type,
        parentId: item.parentId,
        pageSlug: item.pageSlug,
        url: item.url,
        position: i,
      }))
    );
  };

  const serializedItems = serializeItems(items);

  useEffect(() => {
    if (serializedItemsRef.current) {
      serializedItemsRef.current.value = serializedItems;
    }
  }, [serializedItems]);

  const handlePageChange = (slug: string) => {
    setNewPageSlug(slug);
    const selectedPage = availablePages.find((p) => p.slug === slug);
    if (selectedPage && (!newLabel.trim() || availablePages.some(p => p.name === newLabel))) { setNewLabel(selectedPage.name); }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;

    if (serializedItemsRef.current) {
      serializedItemsRef.current.value = serializeItems(itemsRef.current);
    }

    const formData = new FormData(form);
    setIsSaving(true);

    try {
      const result = await adminApi.updateMenu(formData);
      toast.success(result.message ? String(result.message) : "Đã lưu menu.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu menu.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle>Add Menu Item</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label>Link Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as MenuItemType)}
                className="h-10 w-full"
              >
                <option value="page">Existing Page</option>
                <option value="custom">Custom Link</option>
              </select>
            </div>

            <div className="space-y-2">
              <label>Navigation Label</label>
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder=""
              />
            </div>

            <div className="space-y-2">
              <label>Menu Level</label>
              <select
                value={newParentId}
                onChange={(e) => setNewParentId(e.target.value)}
                className="h-10 w-full"
              >
                <option value="">Cấp 1</option>
                {parentOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    Cấp 2 dưới: {item.label}
                  </option>
                ))}
              </select>
            </div>

            {newType === "page" ? (
              <div className="space-y-2">
                <label>Select Page</label>
                <select
                  value={newPageSlug}
                  onChange={(e) => handlePageChange(e.target.value)}
                  className="h-10 w-full"
                >
                  <option value="" disabled>Select a page...</option>
                  {availablePages.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.name} ({getManagedPagePath(p)})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <label>URL</label>
                <Input
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder=""
                />
              </div>
            )}

            <AdminCreateButton type="button" onClick={handleAddItem} className="h-10 w-full">
              Add to Menu
            </AdminCreateButton>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-9">
        <Card>
          <CardHeader>
            <CardTitle>Menu Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <input type="hidden" name="id" value={menu.id} />
              <input ref={serializedItemsRef} type="hidden" name="items" defaultValue={serializedItems} />

              <div className="space-y-2">
                <label>Menu Name</label>
                <Input
                  name="label"
                  defaultValue={menu.label}
                  required
                  placeholder=""
                />
              </div>

              <div className="mt-4 space-y-2">
                <p className="font-medium">Items</p>
                {items.length === 0 ? (
                  <p className="text-muted-foreground italic">No items added yet.</p>
                ) : (
                  <>
                    <ul className="space-y-2 md:hidden">
                      {orderedItems.map((item, index) => (
                        <li
                          key={item.id || `new-${index}`}
                          className="flex items-center justify-between gap-3 rounded-md border bg-card px-3 py-2"
                          style={{
                            marginLeft: `${(itemDepths[item.id] ?? 0) * 50}px`,
                            width: `calc(100% - ${(itemDepths[item.id] ?? 0) * 50}px)`,
                          }}
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
                            <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-0 flex flex-1 flex-row items-center gap-5">
                              <div className="flex min-w-0 flex-row items-center gap-2">
                                <p className="min-w-25 font-medium">{item.label}</p>
                                <p className="flex min-w-0 items-center gap-1 text-sm">
                                  <span className="shrink-0">{getMenuItemMeta(item).typeLabel}:</span>
                                  <span className="truncate">{getMenuItemMeta(item).value}</span>
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <select
                              value={item.parentId ?? ""}
                              onChange={(event) => updateItemParent(item.id, event.target.value || null)}
                              className="h-7.5 w-44 rounded-md border px-3"
                            >
                              <option value="">Gốc</option>
                              {(parentOptionsByItemId[item.id] ?? []).map((option) => (
                                <option key={option.id} value={option.id}>
                                  {"— ".repeat(option.depth)}
                                {option.label}
                              </option>
                            ))}
                            </select>
                            <AdminTableActionButton action="edit" label="Sửa menu item" onClick={() => setEditingItemId(item.id)} />
                            <AdminTableActionButton action="delete" label="Xóa menu item" onClick={() => handleRemoveItem(index)} />
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="hidden md:block">
                      <MenuSortableList
                        items={orderedItems}
                        itemDepths={itemDepths}
                        parentOptionsByItemId={parentOptionsByItemId}
                        onOpenEdit={setEditingItemId}
                        onUpdateParent={updateItemParent}
                        onChange={setOrderedItems}
                        onRemove={handleRemoveItem}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="pt-5 mt-5 border-t">
                <AdminSubmitButton className="h-10 w-full lg:w-auto" disabled={isSaving}>
                  {isSaving ? "Đang lưu..." : "Save Menu"}
                </AdminSubmitButton>
              </div>
            </form>

            <Dialog open={Boolean(editingItem)} onOpenChange={(open) => !open && setEditingItemId(null)}>
              {editingItem ? (
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Sửa menu item</DialogTitle>
                    <DialogDescription>Chỉnh nhãn, loại link và trang đích hoặc URL của mục menu.</DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nhãn</label>
                      <Input
                        value={editingItem.label}
                        onChange={(event) => updateItemFields(editingItem.id, { label: event.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Loại link</label>
                      <select
                        value={editingItem.type}
                        onChange={(event) => {
                          const nextType = event.target.value as MenuItemType;
                          updateItemFields(editingItem.id, {
                            type: nextType,
                            pageSlug: nextType === "page" ? editingItem.pageSlug : null,
                            url: nextType === "custom" ? editingItem.url : null,
                          });
                        }}
                        className="h-10 w-full rounded-md border px-3"
                      >
                        <option value="page">Page</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>

                    {editingItem.type === "page" ? (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Trang đích</label>
                        <select
                          value={editingItem.pageSlug ?? ""}
                          onChange={(event) => {
                            const nextSlug = event.target.value || null;
                            const selectedPage = availablePages.find((page) => page.slug === nextSlug);
                            updateItemFields(editingItem.id, {
                              pageSlug: nextSlug,
                              url: null,
                              label: editingItem.label.trim() ? editingItem.label : (selectedPage?.name ?? editingItem.label),
                            });
                          }}
                          className="h-10 w-full rounded-md border px-3"
                        >
                          <option value="" disabled>Chọn trang</option>
                          {availablePages.map((page) => (
                            <option key={page.slug} value={page.slug}>
                              {page.name} ({getManagedPagePath(page)})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">URL</label>
                        <Input
                          value={editingItem.url ?? ""}
                          onChange={(event) => updateItemFields(editingItem.id, { url: event.target.value, pageSlug: null })}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Parent</label>
                      <select
                        value={editingItem.parentId ?? ""}
                        onChange={(event) => updateItemParent(editingItem.id, event.target.value || null)}
                        className="h-10 w-full rounded-md border px-3"
                      >
                        <option value="">Gốc</option>
                        {editingParentOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {"— ".repeat(option.depth)}
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                      {getMenuItemMeta(editingItem).typeLabel}: {getMenuItemMeta(editingItem).value || "—"}
                    </div>

                    <div className="flex justify-end">
                      <AdminSubmitButton type="button" onClick={() => setEditingItemId(null)}>
                        Xong
                      </AdminSubmitButton>
                    </div>
                  </div>
                </DialogContent>
              ) : null}
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
