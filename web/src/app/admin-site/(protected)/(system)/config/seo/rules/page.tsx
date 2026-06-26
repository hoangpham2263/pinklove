import { requireAdmin } from "@/lib/auth";
import { SeoRulesGuideContent } from "@/features/admin/components/seo/seo-guide-content";

export default async function AdminSeoRulesPage() {
  await requireAdmin();

  return (
    <section className="flex w-full flex-1 flex-col gap-8 p-4 md:p-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">SEO Rules</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Các nguyên tắc vận hành để nội dung SEO ổn định, tránh trùng intent và giữ chất lượng index tốt hơn.
        </p>
      </div>
      <SeoRulesGuideContent />
    </section>
  );
}
