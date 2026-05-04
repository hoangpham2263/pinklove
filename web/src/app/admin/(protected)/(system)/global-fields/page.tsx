import { GlobalFieldsForm } from "@/features/global-fields/admin/global-fields-form";
import { GLOBAL_FIELDS_SCHEMA } from "@/features/global-fields/schema";
import { requireAdmin } from "@/lib/auth";
import { getGlobalFields } from "@/lib/global-fields";

export default async function AdminGlobalFieldsPage() {
  await requireAdmin();
  const values = await getGlobalFields();

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <GlobalFieldsForm fields={GLOBAL_FIELDS_SCHEMA} initialValues={values} />
    </section>
  );
}
