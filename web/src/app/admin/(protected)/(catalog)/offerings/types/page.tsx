import { Plus } from "lucide-react";
import { NativeForm } from "@/components/common/native-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { listOfferingTypes } from "@/features/offerings/server/service";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { OfferingTypeFieldsBuilder } from "./offering-type-fields-builder";

export default async function AdminOfferingTypesPage() {
  await requireAdmin();
  const offeringTypes = await listOfferingTypes({ includeArchived: true });

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Offering Types</h1>
        <p className="text-sm text-muted-foreground">
          Tạo loại offering mới và khai báo fields để form tạo sản phẩm render động.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Danh sách loại</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b text-muted-foreground">
                <tr>
                  <th className="py-3 pr-4 font-medium">Key</th>
                  <th className="py-3 pr-4 font-medium">Tên</th>
                  <th className="py-3 pr-4 font-medium">Fulfillment</th>
                  <th className="py-3 pr-4 font-medium">Fields</th>
                  <th className="py-3 pr-4 font-medium">Trạng thái</th>
                  <th className="py-3 pr-4 font-medium">Tạo offering</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {offeringTypes.map((type) => (
                  <tr key={type.key}>
                    <td className="py-3 pr-4 font-mono text-xs">{type.key}</td>
                    <td className="py-3 pr-4">
                      <div className="font-medium">{type.label}</div>
                      {type.description ? <div className="text-xs text-muted-foreground">{type.description}</div> : null}
                    </td>
                    <td className="py-3 pr-4">{type.fulfillmentType}</td>
                    <td className="py-3 pr-4">{type.fieldSchema.length}</td>
                    <td className="py-3 pr-4">
                      {type.status}
                      {type.isSystem ? <span className="ml-2 rounded border px-1.5 py-0.5 text-xs text-muted-foreground">system</span> : null}
                    </td>
                    <td className="py-3 pr-4">
                      {type.key === "digital_template" ? (
                        <span className="text-xs text-muted-foreground">Luồng riêng</span>
                      ) : (
                        <a
                          href={`${ROUTES.ADMIN.OFFERINGS}?type=${encodeURIComponent(type.key)}`}
                          className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-sm font-medium hover:bg-accent"
                        >
                          Tạo
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Plus className="size-4" /> Tạo / cập nhật type</CardTitle>
          </CardHeader>
          <CardContent>
            <NativeForm action={ROUTES.API.ADMIN.OFFERINGS.TYPES.SAVE} method="POST" className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="key" className="font-medium">Key</label>
                <Input id="key" name="key" placeholder="video_invitation" required pattern="[a-z][a-z0-9_]*" />
              </div>
              <div className="space-y-2">
                <label htmlFor="label" className="font-medium">Tên hiển thị</label>
                <Input id="label" name="label" placeholder="Video cưới" required />
              </div>
              <div className="space-y-2">
                <label htmlFor="description" className="font-medium">Mô tả</label>
                <textarea id="description" name="description" className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="fulfillmentType" className="font-medium">Fulfillment</label>
                  <select id="fulfillmentType" name="fulfillmentType" className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none">
                    <option value="digital">digital</option>
                    <option value="physical">physical</option>
                    <option value="service">service</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="status" className="font-medium">Trạng thái</label>
                  <select id="status" name="status" className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none">
                    <option value="active">active</option>
                    <option value="draft">draft</option>
                    <option value="archived">archived</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="templateKey" className="font-medium">Template key mặc định</label>
                <Input id="templateKey" name="templateKey" placeholder="video_invitation" />
              </div>
              <div className="grid gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="supportsInventory" /> Có tồn kho
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="supportsVendorSupply" /> Cho vendor supply
                </label>
              </div>
              <OfferingTypeFieldsBuilder />
              <Button type="submit" className="w-full">Lưu type</Button>
            </NativeForm>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
