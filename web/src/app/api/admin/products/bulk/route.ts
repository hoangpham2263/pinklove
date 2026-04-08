import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { deleteProducts, updateProductsStatus } from "@/features/products/server/service";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

type BulkAction = "publish" | "draft" | "delete";

function redirectToList(search: string) {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: `${ROUTES.ADMIN.PRODUCT_LIST}${search}` },
  });
}

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const action = String(formData.get("bulkAction") ?? "").trim() as BulkAction;
  const slugs = formData
    .getAll("slugs")
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (slugs.length === 0) {
    return redirectToList("?error=missing_selection");
  }

  if (!["publish", "draft", "delete"].includes(action)) {
    return redirectToList("?error=invalid_bulk_action");
  }

  if (action === "delete") {
    const count = await deleteProducts(slugs);
    return redirectToList(`?bulk=deleted&count=${count}`);
  }

  const count = await updateProductsStatus(slugs, action === "publish" ? "published" : "draft");
  return redirectToList(`?bulk=${action}&count=${count}`);
}
