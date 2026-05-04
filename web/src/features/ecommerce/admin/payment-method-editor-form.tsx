import { Button } from"@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { ROUTES } from"@/lib/routes";
import type { EcommercePaymentMethodSettings } from"@/lib/system-settings";

type PaymentMethodEditorFormProps = {
  method?: EcommercePaymentMethodSettings;
  initialCategory?: EcommercePaymentMethodSettings["category"];
};

const PROVIDER_PRESETS = ["manual_bank_transfer","cash","stripe","paypal","momo","pay2s","vnpay","zalopay","onepay","mock",
];

const CATEGORY_DEFAULTS: Record<
  EcommercePaymentMethodSettings["category"],
  Pick<EcommercePaymentMethodSettings,"provider" |"type">
> = {
  manual: {
    provider:"manual_bank_transfer",
    type:"manual",
  },
  offline: {
    provider:"cash",
    type:"offline",
  },
  gateway: {
    provider:"",
    type:"redirect",
  },
};

function getCategoryName(category: EcommercePaymentMethodSettings["category"]) {
  switch (category) {
    case"offline":
      return"Thanh toán trực tiếp / COD";
    case"gateway":
      return"Cổng thanh toán trực tuyến";
    default:
      return"Chuyển khoản / đối soát";
  }
}

export function PaymentMethodEditorForm({ method, initialCategory ="gateway" }: PaymentMethodEditorFormProps) {
  const isNew = !method;
  const category = method?.category ?? initialCategory;
  const defaults = CATEGORY_DEFAULTS[category];
  const provider = method?.provider ?? defaults.provider;
  const type = method?.type ?? defaults.type;
  const showCategorySelect = !isNew;
  const showProviderField = !isNew || category ==="gateway";
  const showTypeField = !isNew || category ==="gateway";
  const showBankFields = category ==="manual";
  const showPay2sFields = provider ==="pay2s" || method?.code ==="pay2s";
  const showVnpayFields = provider ==="vnpay" || method?.code ==="vnpay";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isNew ?"Thêm phương thức thanh toán" : `Sửa ${method.label}`}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={ROUTES.API.ADMIN.PAYMENT_METHODS.SAVE} method="POST" className="space-y-5">
          <input type="hidden" name="originalCode" value={method?.code ??""} />
          {!showCategorySelect ? <input type="hidden" name="category" value={category} /> : null}
          {!showProviderField ? <input type="hidden" name="provider" value={provider} /> : null}
          {!showTypeField ? <input type="hidden" name="type" value={type} /> : null}

          <label className="flex items-start gap-3 rounded-md border p-4">
            <input type="checkbox" name="enabled" defaultChecked={method?.enabled ?? true} className="mt-1" />
            <div>
              <p>Bật phương thức</p>
              <p className="text-muted-foreground">Phương thức đang bật sẽ xuất hiện ở checkout nếu phù hợp điều kiện đơn hàng.</p>
            </div>
          </label>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <label>Code</label>
              <input
                name="code"
                defaultValue={method?.code ??""}
                placeholder="stripe_card"
                required
                className="h-10 w-full rounded-md border bg-background px-3"
              />
              <p className="text-muted-foreground">Không nên đổi code sau khi đã có order thật.</p>
            </div>
            {showCategorySelect ? (
              <div className="space-y-2">
                <label>Nhóm chính</label>
                <select
                  name="category"
                  defaultValue={category}
                  className="h-10 w-full rounded-md border bg-background px-3"
                >
                  <option value="manual">Chuyển khoản / đối soát</option>
                  <option value="offline">Thanh toán trực tiếp / COD</option>
                  <option value="gateway">Cổng thanh toán trực tuyến</option>
                </select>
                <p className="text-muted-foreground">Giống WooCommerce: chọn nhóm chính trước, sau đó thêm nhà cung cấp bên trong.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p>Nhóm chính</p>
                <div className="flex h-10 items-center rounded-md border bg-muted px-3">
                  {getCategoryName(category)}
                </div>
                <p className="text-muted-foreground">Form này chỉ hiển thị các trường cần cho nhóm đã chọn.</p>
              </div>
            )}
            <div className="space-y-2">
              <label>Tên hiển thị</label>
              <input
                name="label"
                defaultValue={method?.label ??""}
                placeholder="Thẻ quốc tế"
                required
                className="h-10 w-full rounded-md border bg-background px-3"
              />
            </div>
            {showProviderField ? (
              <div className="space-y-2">
                <label>Nhà cung cấp</label>
                <input
                  name="provider"
                  defaultValue={provider}
                  placeholder="stripe"
                  list="payment-provider-presets"
                  className="h-10 w-full rounded-md border bg-background px-3"
                />
                <datalist id="payment-provider-presets">
                  {PROVIDER_PRESETS.map((provider) => (
                    <option key={provider} value={provider} />
                  ))}
                </datalist>
              </div>
            ) : null}
            {showTypeField ? (
              <div className="space-y-2">
                <label>Kiểu xử lý</label>
                <select
                  name="type"
                  defaultValue={type}
                  className="h-10 w-full rounded-md border bg-background px-3"
                >
                  <option value="manual">Đối soát thủ công</option>
                  <option value="offline">Thu tiền trực tiếp</option>
                  <option value="redirect">Chuyển khách sang cổng thanh toán</option>
                  <option value="embedded">Nhúng cổng thanh toán trong checkout</option>
                  <option value="mock">Thanh toán thử nghiệm nội bộ</option>
                </select>
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
            <div className="space-y-2">
              <label>Điều kiện vận chuyển</label>
              <select
                name="requiresShipping"
                defaultValue={
                  method?.requiresShipping === true
                    ?"shipping"
                    : method?.requiresShipping === false
                      ?"no_shipping"
                      :"all"
                }
                className="h-10 w-full rounded-md border bg-background px-3"
              >
                <option value="all">Mọi loại đơn</option>
                <option value="shipping">Chỉ đơn có giao hàng</option>
                <option value="no_shipping">Chỉ đơn không giao hàng</option>
              </select>
            </div>
            <div className="space-y-2">
              <label>Mô tả ngắn tại checkout</label>
              <input
                name="description"
                defaultValue={method?.description ??""}
                className="h-10 w-full rounded-md border bg-background px-3"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label>Hướng dẫn sau khi chọn phương thức</label>
            <textarea
              name="instructions"
              defaultValue={method?.instructions ??""}
              className="min-h-32 w-full rounded-md border bg-background px-3 py-2"
            />
          </div>

          {showBankFields ? (
            <div className="space-y-4 rounded-md border p-4">
              <div>
                <h2>Thông tin nhận thanh toán</h2>
                <p className="text-muted-foreground">
                  Dùng cho chuyển khoản ngân hàng, VietQR hoặc phương thức cần đối soát thủ công.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <label>Tên ngân hàng</label>
                  <input
                    name="bankName"
                    defaultValue={method?.bankName ??""}
                    className="h-10 w-full rounded-md border bg-background px-3"
                  />
                </div>
                <div className="space-y-2">
                  <label>Mã ngân hàng VietQR</label>
                  <input
                    name="bankQrBankId"
                    defaultValue={method?.bankQrBankId ??""}
                    className="h-10 w-full rounded-md border bg-background px-3"
                  />
                </div>
                <div className="space-y-2">
                  <label>Số tài khoản</label>
                  <input
                    name="bankAccountNumber"
                    defaultValue={method?.bankAccountNumber ??""}
                    className="h-10 w-full rounded-md border bg-background px-3"
                  />
                </div>
                <div className="space-y-2">
                  <label>Chủ tài khoản</label>
                  <input
                    name="bankAccountName"
                    defaultValue={method?.bankAccountName ??""}
                    className="h-10 w-full rounded-md border bg-background px-3"
                  />
                </div>
              </div>
            </div>
          ) : null}

          {showPay2sFields ? (
            <div className="space-y-4 rounded-md border p-4">
              <div>
                <h2>Cấu hình Pay2S</h2>
                <p className="text-muted-foreground">
                  Cấu hình này lưu theo phương thức thanh toán Pay2S. Dùng sandbox endpoint để demo workflow thanh toán.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label>API Endpoint</label>
                  <input
                    name="pay2sEndpoint"
                    defaultValue={method?.pay2sEndpoint ??"https://sandbox-payment.pay2s.vn"}
                    className="h-10 w-full rounded-md border bg-background px-3"
                  />
                </div>
                <div className="space-y-2">
                  <label>Request Type</label>
                  <input
                    name="pay2sRequestType"
                    defaultValue={method?.pay2sRequestType ??"pay2s"}
                    className="h-10 w-full rounded-md border bg-background px-3"
                  />
                </div>
                <div className="space-y-2">
                  <label>Partner Code</label>
                  <input
                    name="pay2sPartnerCode"
                    defaultValue={method?.pay2sPartnerCode ??""}
                    className="h-10 w-full rounded-md border bg-background px-3"
                  />
                </div>
                <div className="space-y-2">
                  <label>Partner Name</label>
                  <input
                    name="pay2sPartnerName"
                    defaultValue={method?.pay2sPartnerName ??"PinkLove"}
                    className="h-10 w-full rounded-md border bg-background px-3"
                  />
                </div>
                <div className="space-y-2">
                  <label>Access Key</label>
                  <input
                    name="pay2sAccessKey"
                    defaultValue={method?.pay2sAccessKey ??""}
                    className="h-10 w-full rounded-md border bg-background px-3"
                  />
                </div>
                <div className="space-y-2">
                  <label>Secret Key</label>
                  <input
                    name="pay2sSecretKey"
                    type="password"
                    defaultValue={method?.pay2sSecretKey ??""}
                    className="h-10 w-full rounded-md border bg-background px-3"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label>Bank Accounts</label>
                <textarea
                  name="pay2sBankAccounts"
                  defaultValue={method?.pay2sBankAccounts ??"99999999|ACB"}
                  placeholder={"99999999|ACB\n88888888|VCB"}
                  className="min-h-24 w-full rounded-md border bg-background px-3 py-2"
                />
                <p className="text-muted-foreground">
                  Mỗi dòng gồm số tài khoản và mã ngân hàng, phân tách bằng dấu |. Ví dụ: 99999999|ACB.
                </p>
              </div>
            </div>
          ) : null}

          {showVnpayFields ? (
            <div className="space-y-4 rounded-md border p-4">
              <div>
                <h2>Cấu hình VNPAY</h2>
                <p className="text-muted-foreground">
                  Cấu hình này lưu theo phương thức thanh toán VNPAY, không dùng biến môi trường.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label>Payment URL</label>
                  <input
                    name="vnpayPaymentUrl"
                    defaultValue={method?.vnpayPaymentUrl ??"https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"}
                    className="h-10 w-full rounded-md border bg-background px-3"
                  />
                </div>
                <div className="space-y-2">
                  <label>TMN Code</label>
                  <input
                    name="vnpayTmnCode"
                    defaultValue={method?.vnpayTmnCode ??""}
                    className="h-10 w-full rounded-md border bg-background px-3"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label>Hash Secret</label>
                  <input
                    name="vnpayHashSecret"
                    type="password"
                    defaultValue={method?.vnpayHashSecret ??""}
                    className="h-10 w-full rounded-md border bg-background px-3"
                  />
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button type="submit">{isNew ?"Thêm phương thức" :"Lưu phương thức"}</Button>
            <Button variant="outline" render={<a href={ROUTES.ADMIN.CONFIG_PAYMENT_METHODS}>Quay lại Payment Methods</a>} />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
