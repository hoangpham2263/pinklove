import Link from "next/link";

import { Button } from "@/components/ui/button";
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
    <div className="grid gap-4 md:grid-cols-2">
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
      <VietnamAddressSelects city={address?.city} district={address?.district} ward={address?.ward} />
      <div className="space-y-2 md:col-span-2">
        <label className="font-medium">Địa chỉ chi tiết</label>
        <input name="line1" defaultValue={address?.line1 ?? ""} required placeholder="Số nhà, đường, tòa nhà..." className="h-10 w-full rounded-md border bg-background px-3" />
      </div>
      <div className="space-y-2 md:col-span-2">
        <label className="font-medium">Thông tin bổ sung</label>
        <input name="line2" defaultValue={address?.line2 ?? ""} placeholder="Cổng, tầng, ghi chú địa chỉ..." className="h-10 w-full rounded-md border bg-background px-3" />
      </div>
      <div className="space-y-2">
        <label className="font-medium">Mã bưu chính</label>
        <input name="postalCode" defaultValue={address?.postalCode ?? ""} className="h-10 w-full rounded-md border bg-background px-3" />
      </div>
      <div className="space-y-2">
        <label className="font-medium">Quốc gia</label>
        <input name="country" defaultValue={address?.country ?? "VN"} className="h-10 w-full rounded-md border bg-background px-3" />
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
    <form action={actionUrl} method="POST" className="space-y-4">
      <input type="hidden" name="action" value="save" />
      {address ? <input type="hidden" name="addressId" value={address.id} /> : null}
      <input type="hidden" name="returnTo" value={returnTo} />
      <AddressFields address={address} />
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" name="isDefault" defaultChecked={address?.isDefault ?? false} />
        Dùng làm địa chỉ mặc định
      </label>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" render={<Link href={cancelHref}>Hủy</Link>} />
        <Button type="submit">{submitLabel}</Button>
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
