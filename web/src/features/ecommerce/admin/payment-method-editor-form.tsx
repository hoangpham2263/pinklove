"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NativeForm } from "@/components/common/native-form";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import type { EcommercePaymentMethodSettings } from"@/lib/system-settings";

type PaymentMethodEditorFormProps = {
  method?: EcommercePaymentMethodSettings;
  initialCategory?: EcommercePaymentMethodSettings["category"];
};

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

export function PaymentMethodEditorForm({ method, initialCategory ="manual" }: PaymentMethodEditorFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const isNew = !method;
  const category = method?.category ?? initialCategory;
  const defaults = CATEGORY_DEFAULTS[category];
  const provider = method?.provider ?? defaults.provider;
  const type = method?.type ?? defaults.type;
  const isManual = category === "manual";
  const isOffline = category === "offline";
  const isSimpleMethod = isManual || isOffline;
  const isGateway = category === "gateway";
  const showBankFields = category ==="manual";
  const showPay2sFields = provider ==="pay2s" || method?.code ==="pay2s";
  const showVnpayFields = provider ==="vnpay" || method?.code ==="vnpay";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const result = await adminApi.savePaymentMethod(new FormData(event.currentTarget));
      toast.success(result.message ?? "Đã lưu phương thức thanh toán.");
      finishMutation(router, result, { redirect: isNew ? "replace" : false, refresh: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu phương thức thanh toán.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <NativeForm action={adminApiActions.savePaymentMethod} method="POST" className="space-y-5" onSubmit={handleSubmit}>
          <input type="hidden" name="originalCode" value={method?.code ??""} />
          <input type="hidden" name="category" value={category} />
          <input type="hidden" name="provider" value={provider} />
          <input type="hidden" name="type" value={type} />
          {!isNew && !isGateway ? <input type="hidden" name="code" value={method?.code ??""} /> : null}
          {isGateway ? (
            <>
              <input type="hidden" name="code" value={method?.code ??""} />
              <input type="hidden" name="label" value={method?.label ??""} />
              <input type="hidden" name="description" value={method?.description ??""} />
              <input type="hidden" name="instructions" value={method?.instructions ??""} />
              <input
                type="hidden"
                name="requiresShipping"
                value={
                  method?.requiresShipping === true
                    ?"shipping"
                    : method?.requiresShipping === false
                      ?"no_shipping"
                      :"all"
                }
              />
            </>
          ) : null}

          <input type="hidden" name="enabled" value={method?.enabled ?? true ? "on" : ""} />

          {!isGateway ? (
            <Card className="rounded-md">
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {isNew ? (
                      <div className="space-y-2">
                        <label>Code</label>
                        <Input
                          name="code"
                          defaultValue=""
                          placeholder={category === "offline" ? "cash" : "bank_transfer"}
                          required
                        />
                      </div>
                    ) : null}
                    <div className="space-y-2">
                      <label>Tên hiển thị</label>
                      <Input
                        name="label"
                        defaultValue={method?.label ??""}
                        placeholder="Chuyển khoản ngân hàng"
                        required
                      />
                    </div>
                  </div>

                  {isSimpleMethod ? (
                    <>
                      <input type="hidden" name="requiresShipping" value="all" />
                      <input type="hidden" name="description" value={method?.description ??""} />
                    </>
                  ) : null}

                  {!isSimpleMethod ? (
                    <div className="grid gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
                      <div className="space-y-2">
                        <label>Điều kiện vận chuyển</label>
                        <Select
                          name="requiresShipping"
                          defaultValue={
                            method?.requiresShipping === true
                              ?"shipping"
                              : method?.requiresShipping === false
                                ?"no_shipping"
                                :"all"
                          }
                        >
                          <option value="all">Mọi loại đơn</option>
                          <option value="shipping">Chỉ đơn có giao hàng</option>
                          <option value="no_shipping">Chỉ đơn không giao hàng</option>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label>Mô tả ngắn tại checkout</label>
                        <Input
                          name="description"
                          defaultValue={method?.description ??""}
                        />
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <label>Hướng dẫn sau khi chọn phương thức</label>
                    <Textarea
                      name="instructions"
                      defaultValue={method?.instructions ??""}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {showBankFields ? (
            <Card className="rounded-md">
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <label>Tên ngân hàng</label>
                    <Input
                      name="bankName"
                      defaultValue={method?.bankName ??""}
                    />
                  </div>
                  <div className="space-y-2">
                    <label>Mã ngân hàng VietQR</label>
                    <Input
                      name="bankQrBankId"
                      defaultValue={method?.bankQrBankId ??""}
                    />
                  </div>
                  <div className="space-y-2">
                    <label>Số tài khoản</label>
                    <Input
                      name="bankAccountNumber"
                      defaultValue={method?.bankAccountNumber ??""}
                    />
                  </div>
                  <div className="space-y-2">
                    <label>Chủ tài khoản</label>
                    <Input
                      name="bankAccountName"
                      defaultValue={method?.bankAccountName ??""}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {showPay2sFields ? (
            <div className="space-y-5 rounded-md border p-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2>Cấu hình Pay2S sandbox</h2>
                  <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Sandbox
                  </span>
                </div>
              </div>

              <div className="space-y-4 rounded-md border bg-muted/20 p-4">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold">Thông tin tích hợp</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label>Partner code</label>
                  <Input
                    name="pay2sPartnerCode"
                    defaultValue={method?.pay2sPartnerCode ??""}
                    placeholder="PAY2SEVS..."
                  />
                </div>
                <div className="space-y-2">
                  <label>Access key</label>
                  <Input
                    name="pay2sAccessKey"
                    defaultValue={method?.pay2sAccessKey ??""}
                    placeholder="Access key sandbox"
                  />
                </div>
                <div className="space-y-2">
                  <label>Secret key</label>
                  <Input
                    name="pay2sSecretKey"
                    type="password"
                    defaultValue={method?.pay2sSecretKey ??""}
                    placeholder="Secret key sandbox"
                  />
                </div>
              </div>

              </div>

              <div className="space-y-4 rounded-md border p-4">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold">API EndPoint</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label>Sandbox create endpoint</label>
                    <Input
                      name="pay2sEndpoint"
                      defaultValue={method?.pay2sEndpoint ??"https://sandbox-payment.pay2s.vn/v1/gateway/api/create"}
                      placeholder="https://sandbox-payment.pay2s.vn/v1/gateway/api/create"
                    />
                  </div>
                  <div className="space-y-2">
                    <label>Tài khoản nhận tiền</label>
                    <textarea
                      name="pay2sBankAccounts"
                      defaultValue={method?.pay2sBankAccounts ??""}
                      placeholder="account_number|BANK_ID"
                      className="min-h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
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
                  <Input
                    name="vnpayPaymentUrl"
                    defaultValue={method?.vnpayPaymentUrl ??"https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"}
                  />
                </div>
                <div className="space-y-2">
                  <label>TMN Code</label>
                  <Input
                    name="vnpayTmnCode"
                    defaultValue={method?.vnpayTmnCode ??""}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label>Hash Secret</label>
                  <Input
                    name="vnpayHashSecret"
                    type="password"
                    defaultValue={method?.vnpayHashSecret ??""}
                  />
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <AdminSubmitButton disabled={isSaving}>
              {isSaving ? "Đang lưu..." : isNew ?"Thêm phương thức" :"Lưu phương thức"}
            </AdminSubmitButton>
          </div>
        </NativeForm>
  );
}
