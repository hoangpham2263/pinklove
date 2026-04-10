import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlobalFieldsForm } from "@/features/global-fields/admin/global-fields-form";
import { GLOBAL_FIELDS_SCHEMA } from "@/features/global-fields/schema";
import { requireAdmin } from "@/lib/auth";
import { getGlobalFields } from "@/lib/global-fields";

export default async function AdminGlobalFieldsPage() {
  await requireAdmin();
  const values = await getGlobalFields();

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Global Fields</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý các field dùng chung cho toàn website. Cơ chế này song song với custom fields theo từng managed page.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle>Tổng field</CardTitle>
          </CardHeader>
          <CardContent>{GLOBAL_FIELDS_SCHEMA.length}</CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle>Đã có dữ liệu</CardTitle>
          </CardHeader>
          <CardContent>{Object.values(values).filter((value) => String(value ?? "").trim().length > 0).length}</CardContent>
        </Card>
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Global Fields</CardTitle>
        </CardHeader>
        <CardContent>
          <GlobalFieldsForm fields={GLOBAL_FIELDS_SCHEMA} initialValues={values} />
        </CardContent>
      </Card>
    </section>
  );
}
