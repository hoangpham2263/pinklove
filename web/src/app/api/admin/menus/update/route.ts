import { getCurrentUserFromRequest, isAdminRole } from"@/lib/auth";
import { withTransaction } from "@/lib/database";
import { updateMenu, updateMenuItems, MenuItemInput } from"@/lib/menu";
import { ROUTES } from "@/lib/routes";
import { respondError, respondSuccess } from "@/lib/action-response";

export const runtime ="nodejs";

export async function POST(request:Request) { const actor = await getCurrentUserFromRequest(request);
 if (!actor) {
  return respondError(request, { status: 401, error: "UNAUTHORIZED", message: "Vui lòng đăng nhập admin.", location: ROUTES.ADMIN.LOGIN });
 }
 if (!isAdminRole(actor.role)) {
  return respondError(request, { status: 403, error: "FORBIDDEN", message: "Bạn không có quyền cập nhật menu.", location: ROUTES.CUSTOMER.DASHBOARD });
 }

 const formData = await request.formData();
 const menuId = String(formData.get("id") ?? "").trim();
 if (!menuId) {
  return respondError(request, { error: "INVALID_ID", message: "Thiếu menu id.", location: `${ROUTES.ADMIN.MENUS}?error=invalid_id` });
 }

 const label = String(formData.get("label") ??"").trim();
 if (!label) {
  return respondError(request, { error: "MISSING_LABEL", message: "Thiếu tên menu.", location: `${ROUTES.ADMIN.MENUS}/${menuId}?error=missing_label` });
 }

 const itemsRaw = String(formData.get("items") ??"[]");
 let items:MenuItemInput[] = [];
 try { items = JSON.parse(itemsRaw);
 if (!Array.isArray(items)) { items = []; } } catch {
  return respondError(request, { error: "INVALID_ITEMS_FORMAT", message: "Dữ liệu menu không hợp lệ.", location: `${ROUTES.ADMIN.MENUS}/${menuId}?error=invalid_items_format` });
 }

 try { await withTransaction(async (execute) => {
 await updateMenu(menuId, label, execute);
 await updateMenuItems(menuId, items, execute);
 });
 return respondSuccess(request, { location: `${ROUTES.ADMIN.MENUS}/${menuId}`, message: "Đã lưu menu." }); } catch (error) { console.error("Menu update error:", error);
 const message = error instanceof Error ? error.message : "";
 const errorCode =
  message === "INVALID_MENU_HIERARCHY"
   ? "invalid_hierarchy"
   : message === "INVALID_MENU_ITEMS"
    ? "invalid_items"
   : "update_failed";
 const errorMessage =
  errorCode === "invalid_hierarchy"
   ? "Cấu trúc menu nhiều cấp không hợp lệ."
   : errorCode === "invalid_items"
    ? "Menu item chưa hợp lệ. Item kiểu page phải có trang và custom link phải có URL."
    : "Không thể lưu menu.";
 return respondError(request, { error: errorCode, message: errorMessage, location: `${ROUTES.ADMIN.MENUS}/${menuId}?error=${errorCode}` }); } }
