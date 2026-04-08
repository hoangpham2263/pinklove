"use client";

import dynamic from "next/dynamic";
import { useState } from"react";
import { NativeForm } from"@/components/common/native-form";
import { Button } from"@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Input } from"@/components/ui/input";
import { Menu, MenuItemType } from"@/lib/menu";
import { CmsPage } from"@/lib/cms";
import { GripVertical, Trash2 } from"lucide-react";
import type { EditableMenuItem } from "./menu-sortable-list";

type MenuEditorProps = { menu:Menu;
availablePages:CmsPage[]; };

const MenuSortableList = dynamic(
  () => import("./menu-sortable-list").then((module) => module.MenuSortableList),
  {
    ssr: false,
    loading: () => null,
  }
);

export function MenuEditor({ menu, availablePages }: MenuEditorProps) { const [items, setItems] = useState<EditableMenuItem[]>(
 menu.items.map((item) => ({ ...item }))
 );
 
 const [newLabel, setNewLabel] = useState("");
 const [newType, setNewType] = useState<MenuItemType>("page");
 const [newPageSlug, setNewPageSlug] = useState("");
 const [newUrl, setNewUrl] = useState("");
 const [newParentId, setNewParentId] = useState("");

 const topLevelItems = items.filter((item) => !item.parentId);
 const parentOptions = topLevelItems.map((item) => ({ id: item.id, label: item.label }));

 const handleAddItem = () => { if (!newLabel.trim()) return;
 if (newType ==="page" && !newPageSlug) return;
 if (newType ==="custom" && !newUrl.trim()) return;

 setItems([
 ...items,
 { id:`new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
 parentId:newParentId || null,
 type:newType,
 label:newLabel,
 pageSlug:newType ==="page" ? newPageSlug:null,
 url:newType ==="custom" ? newUrl:null,
 position:items.length, },
 ]);
 
 setNewLabel("");
 setNewPageSlug("");
 setNewUrl("");
 setNewParentId(""); };

 const normalizePositions = (nextItems: EditableMenuItem[]) =>
  nextItems.map((item, i) => ({
   ...item,
   position: i,
  }));

 const handleRemoveItem = (index:number) => {
  const targetItem = items[index];
  if (!targetItem) return;
  const nextItems = items.filter((item) => item.id !== targetItem.id && item.parentId !== targetItem.id);
  setItems(normalizePositions(nextItems));
 };

 // Convert current items array to JSON string to be submitted via NativeForm
 const serializedItems = JSON.stringify(
 items.map((item, i) => ({ label:item.label,
 type:item.type,
 parentId:item.parentId,
 pageSlug:item.pageSlug,
 url:item.url,
 position:i, }))
 );

 const handlePageChange = (slug:string) => { setNewPageSlug(slug);
 const selectedPage = availablePages.find((p) => p.slug === slug);
 if (selectedPage && (!newLabel.trim() || availablePages.some(p => p.name === newLabel))) { setNewLabel(selectedPage.name); } };

 return (
 <div className="flex flex-col lg:flex-row gap-6">
 <div className="w-full lg:w-80 shrink-0">
 <Card>
 <CardHeader>
 <CardTitle>Add Menu Item</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-2">
 <label>Link Type</label>
 <select
 value={newType }
 onChange={(e) => setNewType(e.target.value as MenuItemType) }
 className="h-10 w-full"
 >
 <option value="page">Existing Page</option>
 <option value="custom">Custom Link</option>
 </select>
 </div>

 <div className="space-y-2">
 <label>Navigation Label</label>
 <Input
 value={newLabel }
 onChange={(e) => setNewLabel(e.target.value) }
 placeholder=""
 />
 </div>

 <div className="space-y-2">
 <label>Menu Level</label>
 <select
 value={newParentId }
 onChange={(e) => setNewParentId(e.target.value) }
 className="h-10 w-full"
 >
 <option value="">Cấp 1</option>
 {parentOptions.map((item) => (
 <option key={item.id } value={item.id }>
 Cấp 2 dưới: {item.label }
 </option>
 ))}
 </select>
 </div>

 {newType ==="page" ? (
 <div className="space-y-2">
 <label>Select Page</label>
 <select
 value={newPageSlug }
 onChange={(e) => handlePageChange(e.target.value) }
 className="h-10 w-full"
 >
 <option value="" disabled>Select a page...</option>
 {availablePages.map((p) => (
 <option key={p.slug } value={p.slug }>
 {p.name } (/{p.slug })
 </option>
 )) }
 </select>
 </div>
 ): (
 <div className="space-y-2">
 <label>URL</label>
 <Input
 value={newUrl }
 onChange={(e) => setNewUrl(e.target.value) }
 placeholder=""
 />
 </div>
 ) }

 <Button type="button" onClick={handleAddItem } className="w-full">
 Add to Menu
 </Button>
 </CardContent>
 </Card>
 </div>

 <div className="flex-1">
 <Card>
 <CardHeader>
 <CardTitle>Menu Structure</CardTitle>
 </CardHeader>
 <CardContent>
 <NativeForm action="/api/admin/menus/update" method="POST" className="space-y-4">
 <input type="hidden" name="id" value={menu.id } />
 <input type="hidden" name="items" value={serializedItems } />
 
 <div className="space-y-2">
 <label>Menu Name (Internal)</label>
 <Input
 name="label"
 defaultValue={menu.label }
 required
 placeholder=""
 />
 </div>

 <div className="mt-4 space-y-2">
 <p className="font-medium">Items</p>
 {items.length === 0 ? (
 <p className="text-muted-foreground italic">No items added yet.</p>
 ): (
               <>
                 <ul className="space-y-2 md:hidden">
                   {items.map((item, index) => (
                     <li key={item.id || `new-${index}`} className="flex items-center justify-between rounded-md border bg-card p-3">
                       <div className={`flex items-center gap-3 overflow-hidden ${item.parentId ? "pl-5" : ""}`}>
                         <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
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
                           onClick={() => handleRemoveItem(index)}
                         >
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </div>
                     </li>
                   ))}
                 </ul>
                 <div className="hidden md:block">
                   <MenuSortableList items={items} onChange={setItems} onRemove={handleRemoveItem} />
                 </div>
               </>
 ) }
 </div>

 <div className="pt-6 border-t mt-6">
 <Button type="submit" className="w-full lg:w-auto 0">
 Save Menu
 </Button>
 </div>
 </NativeForm>
 </CardContent>
 </Card>
 </div>
 </div>
 ); }
