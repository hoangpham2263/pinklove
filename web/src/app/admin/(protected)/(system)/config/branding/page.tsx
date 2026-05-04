import { SettingsDataTableForm } from "@/features/admin/components/settings/settings-data-table-form";
import { requireAdmin } from "@/lib/auth";
import { getSystemSettings } from "@/lib/system-settings";

export default async function AdminBrandingSettingsPage() {
  await requireAdmin();
  const settings = await getSystemSettings();

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <SettingsDataTableForm
        section="branding"
        title="Branding"
        saveMessage="Đã lưu cài đặt branding."
        columnWidths={{
          label: "w-[20%]",
          description: "w-[40%]",
          value: "w-[40%]",
        }}
        rows={[
          {
            id: "siteName",
            label: "Site Name",
            description: "Tên thương hiệu hiển thị trong UI, title template và các shell của website.",
            type: "text",
            value: settings.branding.siteName,
          },
          {
            id: "siteSlogan",
            label: "Site Slogan",
            description: "Khẩu hiệu ngắn của thương hiệu, dùng cho các vị trí giới thiệu hoặc nội dung nhận diện.",
            type: "textarea",
            value: settings.branding.siteSlogan,
          },
          {
            id: "brandLogo",
            label: "Brand Logo",
            description: "Logo hiển thị trong header hoặc sidebar. Đây không phải favicon và cũng không phải ảnh social share mặc định.",
            type: "media",
            value: settings.branding.brandLogo,
          },
          {
            id: "siteFavicon",
            label: "Browser Favicon",
            description: "Icon mặc định cho tab trình duyệt và shortcut. Nên dùng `.ico`, `.png` hoặc `.svg` vuông.",
            type: "media",
            value: settings.favicon.siteFavicon,
          },
          {
            id: "appleTouchIcon",
            label: "Apple Touch Icon",
            description: "Icon riêng cho iPhone/iPad khi lưu ra màn hình chính. Nên dùng ảnh vuông kích thước lớn như 180x180.",
            type: "media",
            value: settings.favicon.appleTouchIcon,
          },
        ]}
      />
    </section>
  );
}
