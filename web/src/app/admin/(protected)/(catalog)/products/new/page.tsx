import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAccountsByRole, requireAdmin } from "@/lib/auth";
import { getInvitationTemplateOptions } from "@/features/invitations/templates/registry";
import { listAllProductCategories, listAllProducts } from "@/features/products/server/service";
import { QuickCreateProductForm } from "@/features/products/admin/quick-create-product-form";
import { USER_ROLES } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";
import type { ProductType } from "@/features/products/types";

type AdminProductCreatePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminProductCreatePage({ searchParams }: AdminProductCreatePageProps) {
  await requireAdmin();
  const query = (await searchParams) ?? {};
  const requestedType = getQueryValue(query.type);
  const defaultProductType: ProductType =
    requestedType === "builder_template" || requestedType === "general_product" ? requestedType : "coded_template";
  const returnTo = getQueryValue(query.returnTo) ?? (
    defaultProductType === "builder_template"
      ? ROUTES.ADMIN.PRODUCT_LIST_BUILDER
      : defaultProductType === "general_product"
        ? ROUTES.ADMIN.PRODUCT_LIST_GENERAL
        : ROUTES.ADMIN.PRODUCT_LIST_CODED
  );
  const [categories, products, vendors] = await Promise.all([
    listAllProductCategories(),
    listAllProducts(),
    listAccountsByRole(USER_ROLES.VENDOR),
  ]);
  const usedTemplateKeys = products.map((product) => product.templateKey);
  const codedTemplateOptions = getInvitationTemplateOptions("coded_template");
  const builderTemplateOptions = getInvitationTemplateOptions("builder_template");
  const availableCodedTemplates = codedTemplateOptions.filter((template) => !usedTemplateKeys.includes(template.value));
  const availableBuilderTemplates = builderTemplateOptions.filter((template) => !usedTemplateKeys.includes(template.value));

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="space-y-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tạo mẫu gốc</h1>
          <p className="text-sm text-muted-foreground">Mỗi template chỉ có một sản phẩm gốc duy nhất để hiển thị và bán cho khách hàng.</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Coded template sources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>
              Đã dùng: {codedTemplateOptions.length - availableCodedTemplates.length}/{codedTemplateOptions.length}
            </p>
            <p>
              Còn trống: {availableCodedTemplates.length}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Builder starter sources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>
              Đã dùng: {builderTemplateOptions.length - availableBuilderTemplates.length}/{builderTemplateOptions.length}
            </p>
            <p>
              Còn trống: {availableBuilderTemplates.length}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Sản phẩm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>Nhóm này không dùng template invitation source.</p>
            <p>Đối tác khả dụng: {vendors.length}</p>
          </CardContent>
        </Card>
      </div>
      <QuickCreateProductForm
        categories={categories}
        usedTemplateKeys={usedTemplateKeys}
        vendors={vendors}
        defaultProductType={defaultProductType}
        returnTo={returnTo}
      />
    </section>
  );
}
