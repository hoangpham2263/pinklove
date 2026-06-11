import { MediaCollectionsManager } from "@/features/media/components/media-collections-manager";
import { listMediaCollections } from "@/features/media/server/media-collections";
import { getProviderByUserId } from "@/features/providers/server/service";
import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function ProviderPortfolioPage() {
  const user = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const provider = await getProviderByUserId(user.id);
  const collections = provider ? await listMediaCollections("provider", provider.id) : [];

  return (
    <section className="flex w-full flex-1 flex-col gap-7 p-5 md:p-7.5">
      <div>
        <h1 className="text-2xl font-semibold">Portfolio / Albums</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tạo album ảnh để giới thiệu portfolio, dự án đã làm và gallery dịch vụ của nhà cung cấp.
        </p>
      </div>

      {!provider ? (
        <div className="rounded-md border border-dashed bg-background p-8 text-sm text-muted-foreground">
          Tài khoản provider chưa liên kết hồ sơ nhà cung cấp.
        </div>
      ) : (
        <MediaCollectionsManager
          collections={collections}
          targets={[{ type: "provider", id: provider.id, label: provider.display_name }]}
          targetType="provider"
          targetId={provider.id}
          title="Portfolio / Albums"
          summary="Quản lý các album ảnh gắn trực tiếp với hồ sơ provider này."
        />
      )}
    </section>
  );
}
