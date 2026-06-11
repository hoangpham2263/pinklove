import { BadgePercent } from "lucide-react";

import { NativeForm } from "@/components/common/native-form";
import { DatabasePage } from "@/components/common/database-table";
import { Button } from "@/components/ui/button";
import { getProviderByUserId } from "@/features/providers/server/service";
import { listProviderPricing } from "@/features/providers/server/workspace";
import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function ProviderPricingPage() {
  const user = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const provider = await getProviderByUserId(user.id);
  const rows = provider ? await listProviderPricing(provider.id) : [];

  return (
    <>
      <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
        <div className="rounded-md border bg-background p-5">
          <h1 className="text-2xl font-semibold">Pricing</h1>
          <NativeForm action={ROUTES.API.PROVIDER.PRICING} method="POST" className="mt-4 grid gap-3 md:grid-cols-5">
            <input type="hidden" name="intent" value="save" />
            <input name="offeringId" placeholder="Offering ID (optional)" className="h-9 rounded-md border bg-background px-3 text-sm" />
            <select name="priceType" className="h-9 rounded-md border bg-background px-3 text-sm">
              {["base", "starting_at", "package", "hourly", "custom"].map((item) => <option key={item}>{item}</option>)}
            </select>
            <input name="amount" type="number" min="0" placeholder="Amount" className="h-9 rounded-md border bg-background px-3 text-sm" required />
            <input name="note" placeholder="Note" className="h-9 rounded-md border bg-background px-3 text-sm" />
            <Button type="submit" size="lg">Lưu giá</Button>
          </NativeForm>
        </div>
      </section>
      <DatabasePage
        title="Pricing rows"
        description="Quản lý bảng giá provider theo offering và price type."
        rows={rows}
        icon={BadgePercent}
        metricLabel="Price rows"
        columns={[
          { key: "offering", label: "Offering" },
          { key: "price_type", label: "Type" },
          { key: "amount", label: "Amount" },
          { key: "currency", label: "Currency" },
          { key: "updated_at", label: "Updated" },
        ]}
      />
      <section className="mx-5 mb-7.5 rounded-md border bg-background p-5 md:mx-7.5">
        <h2 className="text-base font-semibold">Xóa dòng giá</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {rows.map((row) => (
            <NativeForm key={String(row.id)} action={ROUTES.API.PROVIDER.PRICING} method="POST">
              <input type="hidden" name="intent" value="delete" />
              <input type="hidden" name="pricingId" value={String(row.id)} />
              <Button type="submit" variant="outline" size="lg">Xóa {String(row.price_type)}</Button>
            </NativeForm>
          ))}
        </div>
      </section>
    </>
  );
}
