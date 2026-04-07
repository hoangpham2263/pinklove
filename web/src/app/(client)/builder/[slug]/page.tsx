import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeForm } from "@/components/common/native-form";
import { getCurrentUser } from "@/lib/auth";
import { getPublishedProductBySlugAndType } from "@/features/products/server/service";
import { getWeddingTemplateDefaults, getWeddingTemplateLabel } from "@/features/sites/templates";
import { ROUTES } from "@/lib/routes";

type BuilderProductDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BuilderProductDetailPage({ params }: BuilderProductDetailPageProps) {
  const { slug } = await params;
  const product = await getPublishedProductBySlugAndType(slug, "builder_template");
  if (!product) {
    notFound();
  }

  const user = await getCurrentUser();
  const defaults = {
    ...getWeddingTemplateDefaults(product.templateKey),
    ...((product.config.siteDefaults as Record<string, unknown> | undefined) ?? {}),
  };

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 lg:grid-cols-12">
      <div className="min-w-0 space-y-6 lg:col-span-9">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[4px] text-muted-foreground">Tự tạo thiệp</p>
          <h1 className="text-4xl font-semibold tracking-tight">{product.name}</h1>
          <p className="text-muted-foreground">{product.description || product.excerpt}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Thông tin builder starter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p><span className="font-medium">Template:</span> {getWeddingTemplateLabel(product.templateKey)}</p>
            <p><span className="font-medium">Loại:</span> Tự tạo thiệp</p>
            <p><span className="font-medium">Giá:</span> {product.price}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Section mặc định khi tạo site</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {Object.entries(defaults).map(([key, value]) => (
              <div key={key} className="rounded-md border p-3">
                <p className="text-xs uppercase tracking-[3px] text-muted-foreground">{key}</p>
                <p className="mt-1 text-sm">{Array.isArray(value) ? `${value.length} item(s)` : String(value)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <aside className="min-w-0 lg:col-span-3 lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle>Tạo site builder từ starter này</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Luồng này tạo trực tiếp một `wedding_site` draft kiểu builder để anh có thể test editor section-based trước khi checkout thật được nối vào.
            </p>
            {user ? (
              <NativeForm action={ROUTES.API.USER.SITES.CREATE_BUILDER} method="POST" className="space-y-3">
                <input type="hidden" name="productSlug" value={product.slug} />
                <Button type="submit" className="w-full">
                  Tạo thiệp tự tạo từ starter này
                </Button>
              </NativeForm>
            ) : (
              <div className="space-y-3">
                <Button className="w-full" render={<Link href={ROUTES.AUTH.LOGIN}>Đăng nhập để bắt đầu</Link>} />
                <Button variant="outline" className="w-full" render={<Link href={ROUTES.AUTH.REGISTER}>Tạo tài khoản mới</Link>} />
              </div>
            )}
          </CardContent>
        </Card>
      </aside>
    </section>
  );
}
