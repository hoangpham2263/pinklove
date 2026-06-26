import { requireAdmin } from "@/lib/auth";
import { SeoPagesGuideContent } from "@/features/admin/components/seo/seo-guide-content";

export default async function AdminSeoPagesPage() {
  await requireAdmin();

  return (
    <section className="flex w-full flex-1 flex-col gap-8 p-4 md:p-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Page SEO</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Hướng dẫn nhập title, description, canonical, OG image và các trường SEO cơ bản cho từng page đang quản lý trong admin.
        </p>
      </div>
      <SeoPagesGuideContent />
    </section>
  );
}
