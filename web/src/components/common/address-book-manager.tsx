import Link from "next/link";
import { Eye, MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUserAddress, type UserAddress } from "@/features/account/address";

type AddressBookManagerProps = {
  addresses: UserAddress[];
  actionUrl: string;
  returnTo?: string;
  createHref: string;
  getViewHref: (addressId: string) => string;
  getEditHref: (addressId: string) => string;
  title?: string;
  description?: string;
  className?: string;
};

export function AddressBookManager({
  addresses,
  actionUrl,
  returnTo,
  createHref,
  getViewHref,
  getEditHref,
  title = "Địa chỉ",
  description = "Quản lý địa chỉ nhận hàng dùng lại trong checkout và các luồng cần giao nhận.",
  className,
}: AddressBookManagerProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <Button
          className="gap-2"
          render={
            <Link href={createHref}>
              <Plus className="h-4 w-4" />
              Thêm địa chỉ
            </Link>
          }
        />
      </CardHeader>
      <CardContent className="space-y-3">
        {addresses.length === 0 ? (
          <div className="rounded-md border border-dashed p-5 text-sm text-muted-foreground">
            Chưa có địa chỉ nào. Địa chỉ đầu tiên được thêm sẽ tự động là địa chỉ mặc định.
          </div>
        ) : null}

        {addresses.map((address) => (
          <div key={address.id} className="grid gap-4 rounded-md border p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <p className="font-semibold">{address.label || "Địa chỉ"}</p>
                {address.isDefault ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    <Star className="h-3 w-3" />
                    Mặc định
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {address.recipientName} • {address.phone}
              </p>
              <p className="truncate text-sm text-muted-foreground">{formatUserAddress(address)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                render={
                  <Link href={getViewHref(address.id)}>
                    <Eye className="h-3.5 w-3.5" />
                    Xem
                  </Link>
                }
              />
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                render={
                  <Link href={getEditHref(address.id)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Sửa
                  </Link>
                }
              />
              {!address.isDefault ? (
                <form action={actionUrl} method="POST">
                  <input type="hidden" name="action" value="setDefault" />
                  <input type="hidden" name="addressId" value={address.id} />
                  {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
                  <Button type="submit" size="sm" variant="outline" className="gap-1.5">
                    <Star className="h-3.5 w-3.5" />
                    Mặc định
                  </Button>
                </form>
              ) : null}
              <form action={actionUrl} method="POST">
                <input type="hidden" name="action" value="delete" />
                <input type="hidden" name="addressId" value={address.id} />
                {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
                <Button type="submit" size="sm" variant="outline" className="gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" />
                  Xóa
                </Button>
              </form>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
