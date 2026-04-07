import { NextResponse } from"next/server";

import { getCurrentUserFromRequest } from"@/lib/auth";
import { updateMenu, updateMenuItems, MenuItemInput } from"@/lib/menu";
import { ROUTES } from "@/lib/routes";

export const runtime ="nodejs";

export async function POST(request:Request) { const actor = await getCurrentUserFromRequest(request);
 if (!actor) { return new NextResponse(null, { status: 303, headers: { Location: ROUTES.ADMIN.LOGIN } }); }
 if (actor.role !=="admin") { return new NextResponse(null, { status: 303, headers: { Location: ROUTES.USER.DASHBOARD } }); }

 const formData = await request.formData();
 const menuId = String(formData.get("id") ?? "").trim();
 if (!menuId) { return new NextResponse(null, { status: 303, headers: { Location: "/admin/menus?error=invalid_id" } }); }

 const label = String(formData.get("label") ??"").trim();
 if (!label) { return new NextResponse(null, { status: 303, headers: { Location: `/admin/menus/${menuId}?error=missing_label` } }); }

 const itemsRaw = String(formData.get("items") ??"[]");
 let items:MenuItemInput[] = [];
 try { items = JSON.parse(itemsRaw);
 if (!Array.isArray(items)) { items = []; } } catch { return new NextResponse(null, { status: 303, headers: { Location: `/admin/menus/${menuId}?error=invalid_items_format` } }); }

 try { await updateMenu(menuId, label);
 await updateMenuItems(menuId, items);
 return new NextResponse(null, { status: 303, headers: { Location: `/admin/menus/${menuId}?saved=1` } }); } catch (error) { console.error("Menu update error:", error);
 return new NextResponse(null, { status: 303, headers: { Location: `/admin/menus/${menuId}?error=update_failed` } }); } }
