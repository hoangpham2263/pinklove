"use client";

import Link from "next/link";
import { type FormEvent, useMemo, useState } from "react";
import { Building2, MapPin } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatUserAddress, type UserAddress } from "@/features/account/address";
import type { UserProfile, UserShippingProfile } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

type PartnerAccountSettingsFormProps = {
  initialProfile: Pick<UserProfile, "fullName" | "displayName" | "phone" | "vendorPortalSlug" | "bio">;
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
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}

function CompletionItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
          done ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
        }`}
      >
        {done ? "Đã đủ" : "Thiếu"}
      </span>
    </div>
  );
}

export function PartnerAccountSettingsForm({
  initialProfile,
  initialShippingProfile,
  addresses,
  portalHref,
}: PartnerAccountSettingsFormProps) {
  const [isSaving, setIsSaving] = useState(false);
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
    const form = event.currentTarget;
    const formData = new FormData(form);

    setIsSaving(true);
    try {
      const response = await fetch("/api/partner/shipping-profile", {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Save failed");
      }

      toast.success("Đã cập nhật hồ sơ lấy và hoàn hàng.");
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_360px]">
      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="rounded-md border bg-background p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted/40">
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Thông tin cửa hàng</h2>
              <p className="text-sm text-muted-foreground">Dữ liệu định danh dùng riêng cho vận hành giao nhận, tách khỏi hồ sơ tài khoản chung.</p>
            </div>
          </div>
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Liên hệ tài khoản</p>
              <p className="mt-1 text-sm font-medium">{initialProfile.fullName || initialProfile.displayName || "Chưa cập nhật"}</p>
            </div>
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Số điện thoại</p>
              <p className="mt-1 text-sm font-medium">{initialProfile.phone || "Chưa cập nhật"}</p>
            </div>
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Hồ sơ chung</p>
              <p className="mt-1 text-sm font-medium">{initialProfile.vendorPortalSlug || "Cập nhật ở hồ sơ tài khoản"}</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Email vận hành" name="contactEmail" type="email" defaultValue={initialShippingProfile.contactEmail} placeholder="ops@shop.vn" />
            <Field label="Tên pháp lý / doanh nghiệp" name="businessName" defaultValue={initialShippingProfile.businessName} placeholder="Cong ty TNHH ABC" />
            <Field label="Tên shop / thương hiệu" name="storeName" defaultValue={initialShippingProfile.storeName} placeholder="ABC Wedding Paper" />
            <div className="rounded-md border border-dashed bg-muted/30 p-4 text-sm leading-6 text-muted-foreground md:col-span-2">
              Thông tin tài khoản chung như tên hiển thị, số điện thoại cá nhân và mô tả hồ sơ vẫn thuộc hồ sơ người dùng. Khối này chỉ lưu dữ liệu để hệ thống biết lấy hàng ở đâu và hoàn hàng về đâu.
            </div>
          </div>
        </section>

        <section className="rounded-md border bg-background p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted/40">
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Địa chỉ vendor</h2>
              <p className="text-sm text-muted-foreground">Địa chỉ được lấy từ cấu hình địa chỉ chung. Không nhập lại ở trang tài khoản.</p>
            </div>
          </div>
          <div className="space-y-4">
            {defaultAddress ? (
              <div className="rounded-md border p-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{defaultAddress.label || "Địa chỉ mặc định"}</p>
                  {defaultAddress.isDefault ? (
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Mặc định
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-muted-foreground">
                  {defaultAddress.recipientName} • {defaultAddress.phone}
                </p>
                <p className="text-muted-foreground">{formatUserAddress(defaultAddress)}</p>
              </div>
            ) : (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                Chưa có địa chỉ vendor. Hãy thêm địa chỉ ở trang cấu hình địa chỉ.
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" render={<Link href={ROUTES.PARTNER.CONFIG_ADDRESSES}>Mở cấu hình địa chỉ</Link>} />
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg" disabled={isSaving}>
            {isSaving ? "Đang lưu..." : "Lưu hồ sơ lấy và hoàn hàng"}
          </Button>
          <a href={portalHref} className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Mở portal đối tác
          </a>
        </div>
      </form>

      <div className="space-y-5">
        <section className="rounded-md border bg-background p-5">
          <h2 className="text-lg font-semibold">Mức sẵn sàng</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">Dựa trên các trường tối thiểu để map sang cấu hình vận chuyển thực tế.</p>
          <div className="mt-4 space-y-3">
            <CompletionItem label="Thông tin liên hệ chính" done={readiness.hasBasics} />
            <CompletionItem label="Thông tin cửa hàng / doanh nghiệp" done={readiness.hasBusiness} />
            <CompletionItem label="Có địa chỉ trong cấu hình" done={readiness.hasAddressBook} />
            <CompletionItem label="Có địa chỉ mặc định" done={readiness.hasDefaultAddress} />
          </div>
        </section>

        <section className="rounded-md border bg-background p-5">
          <h2 className="text-lg font-semibold">Lưu ý vận hành</h2>
          <div className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
            <p>Tài khoản vận chuyển, token API và mapping carrier được quản lý ở khu vực admin, không khai báo tại hồ sơ vendor.</p>
            <p>Nếu kho hoàn hàng khác kho lấy hàng, đừng dùng chung một địa chỉ vì sẽ sai luồng fail delivery.</p>
            <p>`Email vận hành` nên là email chịu trách nhiệm nhận thông báo đối soát đơn, lịch lấy hàng và các vấn đề hoàn trả.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
