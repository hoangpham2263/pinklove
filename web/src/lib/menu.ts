import"server-only";
import { query } from"@/lib/database";

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
 items:MenuItem[]; };

export async function getMenus(): Promise<Omit<Menu,"items">[]> { const result = await query<{ id:string; name:string; label:string }>(
 `SELECT id, name, label FROM cms_menus ORDER BY name ASC`
 );
 return result.rows.map((row) => ({ id:row.id,
 name:row.name,
 label:row.label, })); }

export async function getMenuById(id:string): Promise<Menu | null> { const menuResult = await query<{ id:string; name:string; label:string }>(
 `SELECT id, name, label FROM cms_menus WHERE id = $1 LIMIT 1`,
 [id]
 );

 const menuRow = menuResult.rows[0];
 if (!menuRow) return null;

 const itemsResult = await query<{ id:string;
 menu_id:string;
 parent_id:string | null;
 label:string;
 type:MenuItemType;
 page_slug:string | null;
 url:string | null;
 position:number; }>(
 `SELECT id, menu_id, parent_id, label, type, page_slug, url, position 
  FROM cms_menu_items 
  WHERE menu_id = $1 
  ORDER BY position ASC`,
 [id]
 );

 const items:MenuItem[] = itemsResult.rows.map((row) => ({ id:row.id,
 menuId:row.menu_id,
 parentId:row.parent_id,
 label:row.label,
 type:row.type,
 pageSlug:row.page_slug,
 url:row.url,
 position:row.position, }));

 return { id:menuRow.id,
 name:menuRow.name,
 label:menuRow.label,
 items, }; }

export async function getMenuByName(name:string): Promise<Menu | null> { const menuResult = await query<{ id:string; name:string; label:string }>(
 `SELECT id, name, label FROM cms_menus WHERE name = $1 LIMIT 1`,
 [name]
 );

 const menuRow = menuResult.rows[0];
 if (!menuRow) return null;

 return getMenuById(menuRow.id); }

export async function updateMenu(id:string, label:string): Promise<void> { await query(
 `UPDATE cms_menus SET label = $1, updated_at = NOW() WHERE id = $2`,
 [label, id]
 ); }

export type MenuItemInput = { label:string;
 type:MenuItemType;
 parentId ?: string | null;
 pageSlug ?: string | null;
 url ?: string | null;
 position:number; };

export async function updateMenuItems(menuId:string, items:MenuItemInput[]): Promise<void> { // We'll run this inside a primitive transaction-like block by doing it sequentially.
 // Ideally this would be a real transaction, but for this scale sequential awaits are OK.
 
 // 1. Delete all existing items for this menu
 await query(`DELETE FROM cms_menu_items WHERE menu_id = $1`, [menuId]);
 
 // 2. Insert new items
 for (const item of items) { await query(
  `INSERT INTO cms_menu_items (menu_id, parent_id, label, type, page_slug, url, position)
  VALUES ($1, $2, $3, $4, $5, $6, $7)`,
  [
  menuId,
  item.parentId || null,
  item.label,
  item.type,
  item.pageSlug || null,
  item.url || null,
  item.position,
  ]
 ); }
 
 // Update the menu's updated_at
 await query(`UPDATE cms_menus SET updated_at = NOW() WHERE id = $1`, [menuId]); }
