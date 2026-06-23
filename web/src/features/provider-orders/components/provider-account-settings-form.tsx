"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, MapPin, UserCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MediaSelector } from "@/features/media/components/media-selector";
import { formatUserAddress, type UserAddress } from "@/features/account/address";
import { ProviderLinkButton, ProviderSubmitButton } from "@/features/provider-orders/components/provider-buttons";
import { ProviderField, ProviderInput, ProviderTextarea } from "@/features/provider-orders/components/provider-form";
import { customerApi } from "@/lib/api-client.customer";
import { providerApi } from "@/lib/api-client.provider";
import type { UserProfile, UserShippingProfile } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

type ProviderAccountSettingsFormProps = {
  initialProfile: Pick<UserProfile, "fullName" | "displayName" | "phone" | "providerPortalSlug" | "bio" | "avatarUrl">;
  initialShippingProfile: UserShippingProfile;
  addresses: UserAddress[];
  portalHref: string;
};

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  type = "text",
  disabled = false,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <ProviderField label={label}>
      <ProviderInput id={name} name={name} type={type} defaultValue={defaultValue ?? ""} placeholder={placeholder} disabled={disabled} />
    </ProviderField>
  );
}

function CompletionItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${done ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
        {done ? "Đã đủ" : "Thiếu"}
      </span>
    </div>
  );
}

export function ProviderAccountSettingsForm({
  initialProfile,
  initialShippingProfile,
  addresses,
  portalHref,
}: ProviderAccountSettingsFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatarUrl);
  const defaultAddress = addresses.find((address) => address.isDefault) ?? addresses[0] ?? null;

  const readiness = useMemo(() => {
    const hasBasics = Boolean(initialProfile.fullName || initialProfile.displayName) && Boolean(initialProfile.phone);
    const hasBusiness = Boolean(initialShippingProfile.storeName || initialShippingProfile.businessName) && Boolean(initialShippingProfile.contactEmail);
    const hasAddressBook = addresses.length > 0;
    const hasDefaultAddress = Boolean(defaultAddress);
    return { hasBasics, hasBusiness, hasAddressBook, hasDefaultAddress };
  }, [addresses.length, defaultAddress, initialProfile, initialShippingProfile]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setIsSaving(true);
    try {
      await Promise.all([
        customerApi.updateCustomerProfile(formData),
        providerApi.updateShippingProfile(formData),
      ]);
      toast.success("Đã cập nhật hồ sơ provider.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-12">
      <input type="hidden" name="avatarUrl" value={avatarUrl} />
      <input type="hidden" name="providerPortalSlug" value={initialProfile.providerPortalSlug ?? ""} />

      <div className="min-w-0 space-y-6 lg:col-span-9">
        <Card className="min-w-0 overflow-visible rounded-lg gap-0">
          <CardHeader className="border-b gap-0 pb-0">
            <CardTitle>Hồ sơ provider</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 p-5 md:p-6">
            <section className="space-y-5">
              <div className="flex items-center gap-3 border-b pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted/40">
                  <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Thông tin tài khoản</h2>
                  <p className="text-sm text-muted-foreground">Tên, liên hệ và mô tả hiển thị trong portal provider.</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Họ tên" name="fullName" defaultValue={initialProfile.fullName} placeholder="Nguyen Van A" />
                <Field label="Tên hiển thị" name="displayName" defaultValue={initialProfile.displayName} placeholder="Studio ABC" />
                <Field label="Số điện thoại" name="phone" defaultValue={initialProfile.phone} placeholder="0901234567" />
                <Field label="Provider portal slug" name="providerPortalSlug" defaultValue={initialProfile.providerPortalSlug} disabled />
                <ProviderField label="Bio" className="md:col-span-2">
                  <ProviderTextarea
                    id="bio"
                    name="bio"
                    defaultValue={initialProfile.bio}
                    className="min-h-28"
                    placeholder="Giới thiệu ngắn về provider..."
                  />
                </ProviderField>
              </div>
            </section>

            <section className="space-y-5">
              <div className="flex items-center gap-3 border-b pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted/40">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Thông tin cửa hàng</h2>
                  <p className="text-sm text-muted-foreground">Dữ liệu định danh dùng riêng cho vận hành giao nhận.</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Email vận hành" name="contactEmail" type="email" defaultValue={initialShippingProfile.contactEmail} placeholder="ops@shop.vn" />
                <Field label="Tên pháp lý / doanh nghiệp" name="businessName" defaultValue={initialShippingProfile.businessName} placeholder="Cong ty TNHH ABC" />
                <Field label="Tên shop / thương hiệu" name="storeName" defaultValue={initialShippingProfile.storeName} placeholder="ABC Wedding Paper" />
                <div className="rounded-md border border-dashed bg-muted/30 p-4 text-sm leading-6 text-muted-foreground md:col-span-2">
                  Tài khoản vận chuyển, token API và mapping carrier được quản lý ở khu vực admin, không khai báo tại hồ sơ provider.
                </div>
              </div>
            </section>
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-visible rounded-lg gap-0">
          <CardHeader className="border-b gap-0 pb-0">
            <CardTitle>Địa chỉ provider</CardTitle>
          </CardHeader>
          <CardContent className="p-5 md:p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted/40">
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Địa chỉ mặc định</h2>
                <p className="text-sm text-muted-foreground">Địa chỉ được lấy từ cấu hình địa chỉ chung.</p>
              </div>
            </div>
            <div className="space-y-4">
              {defaultAddress ? (
                <div className="rounded-md border p-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{defaultAddress.label || "Địa chỉ mặc định"}</p>
                    {defaultAddress.isDefault ? (
                      <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Mặc định</span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-muted-foreground">{defaultAddress.recipientName} • {defaultAddress.phone}</p>
                  <p className="text-muted-foreground">{formatUserAddress(defaultAddress)}</p>
                </div>
              ) : (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  Chưa có địa chỉ provider. Hãy thêm địa chỉ ở trang cấu hình địa chỉ.
                </div>
              )}
              <ProviderLinkButton href={ROUTES.PROVIDER.CONFIG_ADDRESSES}>Mở cấu hình địa chỉ</ProviderLinkButton>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="min-w-0 space-y-6 lg:col-span-3">
        <Card className="min-w-0 rounded-lg lg:self-start">
          <CardHeader>
            <CardTitle>Avatar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <MediaSelector value={avatarUrl} onChange={setAvatarUrl} />
            <ProviderSubmitButton type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? "Đang lưu..." : "Lưu hồ sơ"}
            </ProviderSubmitButton>
            <ProviderLinkButton href={portalHref} className="w-full">Mở portal đối tác</ProviderLinkButton>
          </CardContent>
        </Card>

        <Card className="min-w-0 rounded-lg">
          <CardHeader>
            <CardTitle>Mức sẵn sàng</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">Dựa trên các trường tối thiểu để map sang cấu hình vận chuyển thực tế.</p>
            <div className="mt-4 space-y-3">
              <CompletionItem label="Thông tin liên hệ chính" done={readiness.hasBasics} />
              <CompletionItem label="Thông tin cửa hàng / doanh nghiệp" done={readiness.hasBusiness} />
              <CompletionItem label="Có địa chỉ trong cấu hình" done={readiness.hasAddressBook} />
              <CompletionItem label="Có địa chỉ mặc định" done={readiness.hasDefaultAddress} />
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
