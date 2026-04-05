import { NextResponse } from"next/server";

import { getCurrentUserFromRequest } from"@/lib/auth";
import { updateMenu, updateMenuItems, MenuItemInput } from"@/lib/menu";

export const runtime ="nodejs";

export async function POST(request:Request) { const actor = await getCurrentUserFromRequest(request);
 if (!actor) { return NextResponse.redirect(new URL("/admin/login", request.url), 303); }
 if (actor.role !=="admin") { return NextResponse.redirect(new URL("/user/dashboard", request.url), 303); }

 const formData = await request.formData();
 const idRaw = formData.get("id");
 const menuId = Number(idRaw);
 if (isNaN(menuId) || menuId <= 0) { return NextResponse.redirect(new URL("/admin/menus?error=invalid_id", request.url), 303); }

 const label = String(formData.get("label") ??"").trim();
 if (!label) { return NextResponse.redirect(new URL(`/admin/menus/${menuId}?error=missing_label`, request.url), 303); }

 const itemsRaw = String(formData.get("items") ??"[]");
 let items:MenuItemInput[] = [];
 try { items = JSON.parse(itemsRaw);
 if (!Array.isArray(items)) { items = []; } } catch { return NextResponse.redirect(new URL(`/admin/menus/${menuId}?error=invalid_items_format`, request.url), 303); }

 try { await updateMenu(menuId, label);
 await updateMenuItems(menuId, items);
 return NextResponse.redirect(new URL(`/admin/menus/${menuId}?saved=1`, request.url), 303); } catch (error) { console.error("Menu update error:", error);
 return NextResponse.redirect(new URL(`/admin/menus/${menuId}?error=update_failed`, request.url), 303); } }
