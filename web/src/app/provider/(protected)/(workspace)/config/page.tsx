import { ProviderConfigSectionsHub } from "@/features/provider-orders/components/provider-config-sections-hub";
import { ProviderOverviewCard, ProviderOverviewGrid } from "@/features/provider-orders/components/provider-overview-card";
import { ProviderPage, ProviderPageHeader } from "@/features/provider-orders/components/provider-page";
import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

const CONFIG_SECTIONS = [
  {
    title: "Provider",
    icon: "settings" as const,
    items: [
      {
        title: "Tài khoản provider",
        description: "Thông tin cửa hàng, email vận hành và dữ liệu định danh của provider.",
        href: ROUTES.PROVIDER.CONFIG_ACCOUNT,
      },
    ],
  },
  {
    title: "Địa chỉ provider",
    icon: "globe" as const,
    items: [
      {
        title: "Địa chỉ",
        description: "Quản lý địa chỉ dùng chung cho giao nhận, lấy hàng và hoàn hàng.",
        href: ROUTES.PROVIDER.CONFIG_ADDRESSES,
      },
    ],
  },
] as const;

export default async function ProviderConfigPage() {
  await requireProvider(ROUTES.PROVIDER.LOGIN);
  const totalItems = CONFIG_SECTIONS.reduce((sum, section) => sum + section.items.length, 0);

  return (
    <ProviderPage>
      <ProviderPageHeader
        title="Cấu hình"
        description="Trung tâm cấu hình tài khoản, vận hành và địa chỉ của provider."
      />

      <ProviderOverviewGrid>
        <ProviderOverviewCard title="Mục cấu hình" value={totalItems} description="Các khu vực đang bật" />
        <ProviderOverviewCard title="Tài khoản provider" value="Sẵn sàng" description="Thông tin cửa hàng và vận hành" />
        <ProviderOverviewCard title="Địa chỉ" value="Đang dùng" description="Giao nhận, lấy hàng, hoàn hàng" />
        <ProviderOverviewCard title="Phạm vi" value="Provider" description="Không gian đối tác" />
      </ProviderOverviewGrid>

      <ProviderConfigSectionsHub sections={[...CONFIG_SECTIONS]} />
    </ProviderPage>
  );
}
