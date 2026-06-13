import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUserAddress, type UserAddress } from "@/features/account/address";
import { VietnamAddressSelects } from "@/components/common/vietnam-address-selects";

type AddressEditorFormProps = {
  actionUrl: string;
  returnTo: string;
  cancelHref: string;
  address?: UserAddress;
  submitLabel?: string;
};

function AddressFields({ address }: { address?: UserAddress }) {
  return (
    <div className="space-y-8">
      <section className="space-y-5">
        <div className="border-b pb-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Liên hệ</p>
          <h3 className="mt-1 text-lg font-semibold">Thông tin người nhận</h3>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="font-medium">Tên địa chỉ</label>
            <input name="label" defaultValue={address?.label ?? ""} placeholder="Nhà riêng, Văn phòng..." className="h-10 w-full rounded-md border bg-background px-3" />
          </div>
          <div className="space-y-2">
            <label className="font-medium">Người nhận</label>
            <input name="recipientName" defaultValue={address?.recipientName ?? ""} required className="h-10 w-full rounded-md border bg-background px-3" />
          </div>
          <div className="space-y-2">
            <label className="font-medium">Số điện thoại</label>
            <input name="phone" defaultValue={address?.phone ?? ""} required className="h-10 w-full rounded-md border bg-background px-3" />
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="border-b pb-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Địa chỉ</p>
          <h3 className="mt-1 text-lg font-semibold">Khu vực giao nhận</h3>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <VietnamAddressSelects city={address?.city} district={address?.district} ward={address?.ward} />
          <div className="space-y-2 md:col-span-2">
            <label className="font-medium">Địa chỉ chi tiết</label>
            <input name="line1" defaultValue={address?.line1 ?? ""} required placeholder="Số nhà, đường, tòa nhà..." className="h-10 w-full rounded-md border bg-background px-3" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="font-medium">Thông tin bổ sung</label>
            <input name="line2" defaultValue={address?.line2 ?? ""} placeholder="Cổng, tầng, ghi chú địa chỉ..." className="h-10 w-full rounded-md border bg-background px-3" />
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="border-b pb-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Mở rộng</p>
          <h3 className="mt-1 text-lg font-semibold">Mã vùng</h3>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="font-medium">Mã bưu chính</label>
            <input name="postalCode" defaultValue={address?.postalCode ?? ""} className="h-10 w-full rounded-md border bg-background px-3" />
          </div>
          <div className="space-y-2">
            <label className="font-medium">Quốc gia</label>
            <input name="country" defaultValue={address?.country ?? "VN"} className="h-10 w-full rounded-md border bg-background px-3" />
          </div>
        </div>
      </section>
    </div>
  );
}

function AddressSummary({ address }: { address?: UserAddress }) {
  return (
    <div className="space-y-3 rounded-md border bg-muted/30 p-4 text-sm">
      <div>
        <p className="text-muted-foreground">Tên địa chỉ</p>
        <p className="mt-1 font-medium">{address?.label || "Địa chỉ mới"}</p>
      </div>
      <div>
        <p className="text-muted-foreground">Người nhận</p>
        <p className="mt-1 font-medium">{address?.recipientName || "Chưa nhập"}</p>
      </div>
      <div>
        <p className="text-muted-foreground">Địa chỉ hiện tại</p>
        <p className="mt-1 leading-6">{address ? formatUserAddress(address) : "Chưa có dữ liệu"}</p>
      </div>
    </div>
  );
}

export function AddressEditorForm({
  actionUrl,
  returnTo,
  cancelHref,
  address,
  submitLabel = address ? "Lưu địa chỉ" : "Thêm địa chỉ",
}: AddressEditorFormProps) {
  return (
    <form action={actionUrl} method="POST" className="grid gap-6 lg:grid-cols-12">
      <input type="hidden" name="action" value="save" />
      {address ? <input type="hidden" name="addressId" value={address.id} /> : null}
      <input type="hidden" name="returnTo" value={returnTo} />

      <div className="min-w-0 space-y-6 lg:col-span-9">
        <Card className="min-w-0 overflow-visible rounded-lg gap-0">
          <CardHeader className="border-b gap-0 pb-0">
            <CardTitle>Thông tin địa chỉ</CardTitle>
          </CardHeader>
          <CardContent className="p-5 md:p-6">
            <AddressFields address={address} />
          </CardContent>
        </Card>
      </div>

      <div className="min-w-0 space-y-6 lg:col-span-3">
        <Card className="min-w-0 rounded-lg lg:self-start">
          <CardHeader>
            <CardTitle>Thiết lập</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" name="isDefault" defaultChecked={address?.isDefault ?? false} />
              Dùng làm địa chỉ mặc định
            </label>

            <Button type="submit" className="w-full">{submitLabel}</Button>
            <Button type="button" variant="outline" className="w-full" render={<Link href={cancelHref}>Hủy</Link>} />
          </CardContent>
        </Card>

        <Card className="min-w-0 rounded-lg">
          <CardHeader>
            <CardTitle>Tóm tắt</CardTitle>
          </CardHeader>
          <CardContent>
            <AddressSummary address={address} />
          </CardContent>
        </Card>
      </div>
    </form>
  );
}

export function AddressDetails({ address }: { address: UserAddress }) {
  const rows = [
    ["Tên địa chỉ", address.label || "Địa chỉ"],
    ["Người nhận", address.recipientName],
    ["Số điện thoại", address.phone],
    ["Địa chỉ", formatUserAddress(address)],
    ["Mã bưu chính", address.postalCode || "Chưa cập nhật"],
    ["Quốc gia", address.country || "VN"],
  ];

  return (
    <div className="space-y-3">
      {rows.map(([label, value]) => (
        <div key={label} className="grid gap-1 rounded-md border p-3 text-sm md:grid-cols-[160px_1fr]">
          <p className="font-medium text-muted-foreground">{label}</p>
          <p className="text-foreground">{value}</p>
        </div>
      ))}
    </div>
  );
}
