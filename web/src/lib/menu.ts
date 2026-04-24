import"server-only";
import { query, type DbExecutor } from"@/lib/database";

export type MenuItemType ="page" |"custom";

export type MenuItem = { id:string;
 menuId:string;
 parentId:string | null;
 label:string;
 type:MenuItemType;
 pageSlug:string | null;
 url:string | null;
 position:number; };

export type Menu = { id:string;
 name:string;
 label:string;
 itemCount?: number;
 items:MenuItem[]; };

type MenuStorage = {
 menusTable: "navigation_menus" | "cms_menus";
 itemsTable: "navigation_menu_items" | "cms_menu_items";
};

let menuStoragePromise: Promise<MenuStorage> | null = null;

async function getMenuStorage(): Promise<MenuStorage> {
 if (!menuStoragePromise) {
  menuStoragePromise = (async () => {
   const result = await query<{ exists: boolean }>(
    `SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'navigation_menus'
    ) AS exists`
   );

   const hasNavigationTables = Boolean(result.rows[0]?.exists);

   return hasNavigationTables
    ? {
       menusTable: "navigation_menus",
       itemsTable: "navigation_menu_items",
      }
    : {
       menusTable: "cms_menus",
       itemsTable: "cms_menu_items",
      };
  })();
 }

 return menuStoragePromise;
}

export async function getMenus(): Promise<Omit<Menu,"items">[]> {
 const storage = await getMenuStorage();
 const result = await query<{ id:string; name:string; label:string; item_count:string }>(
 `SELECT
   m.id::text AS id,
   m.name,
   m.label,
   COUNT(i.id)::text AS item_count
  FROM ${storage.menusTable} m
  LEFT JOIN ${storage.itemsTable} i ON i.menu_id = m.id
  GROUP BY m.id, m.name, m.label
  ORDER BY m.name ASC`
 );
 return result.rows.map((row) => ({ id:row.id,
 name:row.name,
 label:row.label,
 itemCount:Number(row.item_count ?? "0"), }));
}

async function loadMenuItems(storage: MenuStorage, id: string): Promise<MenuItem[]> {
 const itemsResult = await query<{ id:string;
 menu_id:string;
 parent_id:string | null;
 label:string;
 type:MenuItemType;
 page_slug:string | null;
 url:string | null;
 position:number; }>(
 `SELECT id::text AS id, menu_id::text AS menu_id, parent_id, label, type, page_slug, url, position 
  FROM ${storage.itemsTable}
  WHERE menu_id = $1 
  ORDER BY position ASC`,
 [id]
 );

 return itemsResult.rows.map((row) => ({ id:row.id,
 menuId:row.menu_id,
 parentId:row.parent_id,
 label:row.label,
 type:row.type,
 pageSlug:row.page_slug,
 url:row.url,
 position:row.position, }));
}

function buildMenu(menuRow: { id: string; name: string; label: string }, items: MenuItem[]): Menu {
 return { id:menuRow.id,
 name:menuRow.name,
 label:menuRow.label,
 items, };
}

export async function getMenuById(id:string): Promise<Menu | null> {
 const storage = await getMenuStorage();
 const menuResult = await query<{ id:string; name:string; label:string }>(
 `SELECT id::text AS id, name, label FROM ${storage.menusTable} WHERE id = $1 LIMIT 1`,
 [id]
 );

 const menuRow = menuResult.rows[0];
 if (!menuRow) return null;
 const items = await loadMenuItems(storage, id);
 return buildMenu(menuRow, items);
}

export async function getMenuByName(name:string): Promise<Menu | null> {
 const storage = await getMenuStorage();
 const menuResult = await query<{ id:string; name:string; label:string }>(
 `SELECT id::text AS id, name, label FROM ${storage.menusTable} WHERE name = $1 LIMIT 1`,
 [name]
 );

 const menuRow = menuResult.rows[0];
 if (!menuRow) return null;
 const items = await loadMenuItems(storage, menuRow.id);
 return buildMenu(menuRow, items);
}

export async function updateMenu(id:string, label:string, execute:DbExecutor = query): Promise<void> {
 const storage = await getMenuStorage();
 await execute(
 `UPDATE ${storage.menusTable} SET label = $1, updated_at = NOW() WHERE id = $2`,
 [label, id]
 );
}

export type MenuItemInput = { id?: string;
 label:string;
 type:MenuItemType;
 parentId ?: string | null;
 pageSlug ?: string | null;
 url ?: string | null;
 position:number; };

export async function updateMenuItems(menuId:string, items:MenuItemInput[], execute:DbExecutor = query): Promise<void> {
 const storage = await getMenuStorage();
 const normalizedItems = items.map((item) => {
  const normalizedLabel = item.label.trim();
  const normalizedType = item.type === "custom" ? "custom" : "page";
  const normalizedPageSlug = normalizedType === "page" ? item.pageSlug?.trim() || null : null;
  const normalizedUrl = normalizedType === "custom" ? item.url?.trim() || null : null;

  if (!normalizedLabel) {
   throw new Error("INVALID_MENU_ITEMS");
  }

  if (normalizedType === "page" && !normalizedPageSlug) {
   throw new Error("INVALID_MENU_ITEMS");
  }

  if (normalizedType === "custom" && !normalizedUrl) {
   throw new Error("INVALID_MENU_ITEMS");
  }

  return {
   ...item,
   label: normalizedLabel,
   type: normalizedType,
   pageSlug: normalizedPageSlug,
   url: normalizedUrl,
   parentId: item.parentId?.trim() || null,
  };
 });

 // 1. Delete all existing items for this menu
 await execute(`DELETE FROM ${storage.itemsTable} WHERE menu_id = $1`, [menuId]);

 const usedSourceIds = new Set<string>();
 const pendingItems = normalizedItems.map((item, index) => {
  const requestedSourceId = item.id?.trim() || `generated-${index}`;
  const sourceId = usedSourceIds.has(requestedSourceId) ? `dedup-${index}-${requestedSourceId}` : requestedSourceId;
  usedSourceIds.add(sourceId);
  const existingDbId = item.id?.trim() && /^\d+$/.test(item.id.trim()) ? item.id.trim() : null;

  return {
   ...item,
   sourceId,
   existingDbId,
  };
 });
 const validSourceIds = new Set(pendingItems.map((item) => item.sourceId));
 const insertedIdMap = new Map<string, string>();

 for (const item of pendingItems) {
  if (item.parentId && !validSourceIds.has(item.parentId)) {
   throw new Error("INVALID_MENU_HIERARCHY");
  }
 }

 // 2. Reinsert items while preserving parent-child relationships.
 while (pendingItems.length > 0) {
  let insertedInPass = 0;

  for (let index = 0; index < pendingItems.length; ) {
   const item = pendingItems[index];
   const normalizedParentSourceId =
    item.parentId && validSourceIds.has(item.parentId) && item.parentId !== item.sourceId
     ? item.parentId
     : null;
   const resolvedParentId = normalizedParentSourceId ? insertedIdMap.get(normalizedParentSourceId) : null;

   if (normalizedParentSourceId && !resolvedParentId) {
    index += 1;
    continue;
   }

   const insertResult = item.existingDbId
    ? await execute<{ id:string }>(
       `INSERT INTO ${storage.itemsTable} (id, menu_id, parent_id, label, type, page_slug, url, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id::text AS id`,
       [
        item.existingDbId,
        menuId,
        resolvedParentId || null,
        item.label,
        item.type,
        item.pageSlug || null,
        item.url || null,
        item.position,
       ]
      )
    : await execute<{ id:string }>(
       `INSERT INTO ${storage.itemsTable} (menu_id, parent_id, label, type, page_slug, url, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id::text AS id`,
       [
        menuId,
        resolvedParentId || null,
        item.label,
        item.type,
        item.pageSlug || null,
        item.url || null,
        item.position,
       ]
      );

   const insertedId = insertResult.rows[0]?.id;
   if (!insertedId) {
    throw new Error("INVALID_MENU_ITEMS");
   }

   insertedIdMap.set(item.sourceId, insertedId);
   pendingItems.splice(index, 1);
   insertedInPass += 1;
  }

  if (insertedInPass === 0) {
   throw new Error("INVALID_MENU_HIERARCHY");
  }
 }
 
 // Update the menu's updated_at
 await execute(`UPDATE ${storage.menusTable} SET updated_at = NOW() WHERE id = $1`, [menuId]);
}
