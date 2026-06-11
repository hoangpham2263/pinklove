import { assignProviderRegion, saveRegion } from "@/features/providers/server/marketplace";
import { getProviderByUserId } from "@/features/providers/server/service";
import { removeProviderRegion } from "@/features/providers/server/workspace";
import { respondError, respondSuccess } from "@/lib/action-response";
import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function POST(request: Request) {
  const user = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const provider = await getProviderByUserId(user.id);
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "assign");

  if (!provider) {
    return respondError(request, {
      error: "provider_missing",
      message: "Chưa có hồ sơ provider.",
      location: ROUTES.PROVIDER.REGIONS,
    });
  }

  if (intent === "delete") {
    await removeProviderRegion(provider.id, String(formData.get("regionId") ?? "").trim());
    return respondSuccess(request, { location: ROUTES.PROVIDER.REGIONS, message: "Đã xóa khu vực." });
  }

  const regionName = String(formData.get("regionName") ?? "").trim();
  const selectedRegionId = String(formData.get("regionId") ?? "").trim();
  const regionId = selectedRegionId || await saveRegion({
    name: regionName,
    slug: slugify(regionName),
    regionType: "city",
  });

  if (!regionId) {
    return respondError(request, {
      error: "region_required",
      message: "Vui lòng chọn hoặc nhập khu vực.",
      location: ROUTES.PROVIDER.REGIONS,
    });
  }

  await assignProviderRegion({
    providerId: provider.id,
    regionId,
    serviceMode: String(formData.get("serviceMode") ?? "available") as never,
  });
  return respondSuccess(request, { location: ROUTES.PROVIDER.REGIONS, message: "Đã lưu khu vực phục vụ." });
}
