import { addOrganizationMember, ensureOrganizationRole } from "@/features/organizations/server/service";
import { createProviderOrganization } from "@/features/providers/server/workspace";
import { respondError, respondSuccess } from "@/lib/action-response";
import { requireProvider } from "@/lib/auth";
import { query } from "@/lib/database";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function POST(request: Request) {
  const user = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "create");

  if (intent === "role" || intent === "invite") {
    const organizationId = String(formData.get("organizationId") ?? "").trim();
    const owned = await query<{ id: string }>(
      "SELECT id FROM organizations WHERE id = $1 AND owner_user_id = $2 LIMIT 1",
      [organizationId, user.id]
    );
    if (!owned.rows[0]) {
      return respondError(request, {
        status: 403,
        error: "organization_forbidden",
        message: "Organization không thuộc tài khoản này.",
        location: ROUTES.PROVIDER.ORGANIZATION,
      });
    }

    const roleKey = String(formData.get("roleKey") ?? "").trim() || "member";
    const roleLabel = String(formData.get("roleLabel") ?? "").trim() || roleKey;
    await ensureOrganizationRole({
      organizationId,
      key: roleKey,
      label: roleLabel,
      permissions: String(formData.get("permissions") ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    });

    if (intent === "invite") {
      const userId = String(formData.get("userId") ?? "").trim();
      if (!userId) {
        return respondError(request, {
          error: "member_required",
          message: "User ID là bắt buộc khi mời thành viên.",
          location: ROUTES.PROVIDER.ORGANIZATION,
        });
      }
      await addOrganizationMember({
        organizationId,
        userId,
        roleKey,
        roleLabel,
        status: "invited",
        metadata: { invitedByUserId: user.id },
      });
    }

    return respondSuccess(request, { location: ROUTES.PROVIDER.ORGANIZATION, message: "Đã cập nhật organization." });
  }

  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? "").trim() || name);

  if (!name || !slug) {
    return respondError(request, {
      error: "organization_invalid",
      message: "Tên tổ chức là bắt buộc.",
      location: ROUTES.PROVIDER.ORGANIZATION,
    });
  }

  await createProviderOrganization({
    ownerUserId: user.id,
    name,
    slug,
    organizationType: String(formData.get("organizationType") ?? "provider_group"),
  });
  return respondSuccess(request, { location: ROUTES.PROVIDER.ORGANIZATION, message: "Đã lưu organization." });
}
