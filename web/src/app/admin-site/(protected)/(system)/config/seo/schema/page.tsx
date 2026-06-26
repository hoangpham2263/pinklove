import { requireAdmin } from "@/lib/auth";
import { SeoSchemaGuideContent } from "@/features/admin/components/seo/seo-guide-content";

export default async function AdminSeoSchemaPage() {
  await requireAdmin();

  return (
    <section className="flex w-full flex-1 flex-col gap-8 p-4 md:p-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">SEO Schema</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Mẫu JSON-LD và hướng dẫn nhập structured data đúng ngữ cảnh để Google hiểu rõ nội dung của từng page.
        </p>
      </div>
      <SeoSchemaGuideContent />
    </section>
  );
}
