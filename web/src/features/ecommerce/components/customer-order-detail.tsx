import Link from "next/link";

import { NativeForm } from "@/components/common/native-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentMethodGuide } from "@/features/ecommerce/components/payment-method-guide";
import { VatInvoiceInfo } from "@/features/ecommerce/components/vat-invoice-info";
import type { EcommerceOrder } from "@/features/ecommerce/types";
import { formatCurrency } from "@/lib/currency";
import { ROUTES } from "@/lib/routes";
import { getPaymentMethodLabel } from "@/lib/payment-methods";
import { getOrderStatusLabel, getPaymentStatusLabel } from "@/lib/status-labels";
import type { EcommerceSettings } from "@/lib/system-settings";
import { isBuilderOfferingType, isInvitationOfferingType } from "@/features/offerings/types";

type CustomerOrderDetailProps = {
  order: EcommerceOrder;
  ecommerceSettings: EcommerceSettings;
};

export function CustomerOrderDetail({ order, ecommerceSettings }: CustomerOrderDetailProps) {
  const primaryPayment = order.payments[0];

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Đơn hàng {order.orderNumber}</h1>
          <p className="text-muted-foreground">
            Theo dõi trạng thái đơn, thanh toán và sử dụng sản phẩm đã mua.
          </p>
        </div>
        <Button variant="outline" render={<Link href={ROUTES.CUSTOMER.ORDERS}>Quay lại danh sách đơn</Link>} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trạng thái đơn</CardTitle>
          </CardHeader>
          <CardContent className="font-semibold">{getOrderStatusLabel(order.status)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thanh toán</CardTitle>
          </CardHeader>
          <CardContent className="font-semibold">{getPaymentStatusLabel(order.paymentStatus)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tổng tiền</CardTitle>
          </CardHeader>
          <CardContent className="font-semibold">{formatCurrency(order.totalAmount, ecommerceSettings)}</CardContent>
        </Card>
      </div>

      {primaryPayment ? (
        <Card>
          <CardHeader>
            <CardTitle>Hướng dẫn thanh toán</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Phương thức đã chọn: <span className="font-medium text-foreground">{getPaymentMethodLabel(primaryPayment.method, ecommerceSettings)}</span>
            </p>
            <PaymentMethodGuide
              method={primaryPayment.method}
              settings={ecommerceSettings}
              amount={order.totalAmount}
              orderNumber={order.orderNumber}
              requiresShipping={order.fulfillmentStatus !== "not_required"}
            />
          </CardContent>
        </Card>
      ) : null}

      {order.metadata.requestVatInvoice ? (
        <Card>
          <CardHeader>
            <CardTitle>Hóa đơn VAT</CardTitle>
          </CardHeader>
          <CardContent>
            <VatInvoiceInfo info={order.metadata.vatInvoiceInfo} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Sản phẩm trong đơn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.items.map((item) => {
            const canUseOffering =
              order.paymentStatus === "paid" && item.fulfillmentType === "digital" && Boolean(item.offeringId) && isInvitationOfferingType(item.offeringType);
            const createAction =
              isBuilderOfferingType(item.offeringType)
                ? ROUTES.API.CUSTOMER.INVITATIONS.CREATE_BUILDER
                : ROUTES.API.CUSTOMER.INVITATIONS.CREATE_FROM_OFFERING;

            return (
              <div key={item.id} className="rounded-md border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{item.offeringName}</p>
                    <p className="text-muted-foreground">
                      {item.offeringType} • {item.fulfillmentType} • SL {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium">{formatCurrency(item.lineTotal, ecommerceSettings)}</p>
                </div>

                {canUseOffering ? (
                  <NativeForm action={createAction} method="POST" className="mt-4">
                    <input type="hidden" name="offeringSlug" value={item.offeringSlug} />
                    <Button type="submit">
                      {isBuilderOfferingType(item.offeringType) ? "Tạo thiệp builder" : "Tạo thiệp từ template"}
                    </Button>
                  </NativeForm>
                ) : (
                  <p className="mt-4 text-muted-foreground">
                    {item.fulfillmentType === "digital" && isInvitationOfferingType(item.offeringType)
                      ? "Sản phẩm sẽ dùng được sau khi đơn chuyển sang trạng thái đã thanh toán."
                      : "Sản phẩm này không tạo thiệp trực tiếp trong hệ thống."}
                  </p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {order.shipment ? (
        <Card>
          <CardHeader>
            <CardTitle>Vận chuyển</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-muted-foreground">Trạng thái</p>
              <p className="font-semibold">{order.shipment.status}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Đơn vị</p>
              <p className="font-semibold">{order.shipment.carrier || "Chưa cập nhật"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Mã tracking</p>
              <p className="font-semibold">{order.shipment.trackingNumber || "Chưa cập nhật"}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
