import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createCmsPage } from "@/lib/cms";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return new NextResponse(null, { status: 303, headers: { Location: ROUTES.ADMIN.LOGIN } });
  }

  const formData = await request.formData();
  const name = String(formData.get("name") ?? "");
  let slug = String(formData.get("slug") ?? "");

  if (!name) {
    return new NextResponse(null, { status: 303, headers: { Location: `${ROUTES.ADMIN.DASHBOARD}/pages?error=missing_name` } });
  }

  // Normalize slug if missing or dirty
  if (!slug) {
    slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  try {
    await createCmsPage({
      name,
      slug,
      status: "draft",
      template: "default",
    });

    return new NextResponse(null, { status: 303, headers: { Location: `/admin/pages/${slug}` } });
  } catch (error) {
    console.error("Failed to create page:", error);
    return new NextResponse(null, { status: 303, headers: { Location: "/admin/pages?error=creation_failed" } });
  }
}
