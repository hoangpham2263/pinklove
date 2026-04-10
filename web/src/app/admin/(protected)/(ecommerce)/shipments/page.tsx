import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listAllShipments } from "@/features/ecommerce/server/service";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function AdminShipmentsPage() {
  await requireAdmin();
  const shipments = await listAllShipments();

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div>
        <h1 className="text-2xl font-semibold">Shipments</h1>
        <p className="text-sm text-muted-foreground">Cập nhật đơn vị vận chuyển, tracking và trạng thái giao hàng.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách shipment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {shipments.map((shipment) => (
            <form key={shipment.id} action={ROUTES.API.ADMIN.SHIPMENTS.UPDATE} method="POST" className="rounded-md border p-4">
              <input type="hidden" name="orderId" value={shipment.orderId} />
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_160px_160px_180px_auto] lg:items-end">
                <div>
                  <p className="font-medium">{shipment.orderId}</p>
                  <p className="text-sm text-muted-foreground">Shipment ID: {shipment.id}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Trạng thái</label>
                  <select name="status" defaultValue={shipment.status} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                    {["pending", "packing", "shipped", "delivered", "returned", "cancelled"].map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Carrier</label>
                  <input type="text" name="carrier" defaultValue={shipment.carrier} className="h-10 w-full rounded-md border bg-background px-3 text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tracking</label>
                  <input type="text" name="trackingNumber" defaultValue={shipment.trackingNumber} className="h-10 w-full rounded-md border bg-background px-3 text-sm" />
                </div>
                <Button type="submit">Lưu</Button>
              </div>
            </form>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
