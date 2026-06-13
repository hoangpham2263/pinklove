"use client";

import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MediaSelector } from "@/features/media/components/media-selector";
import { customerApi } from "@/lib/api-client.customer";

type CustomerProfileFormProps = {
  initialProfile: {
    fullName: string;
    displayName: string;
    phone: string;
    providerPortalSlug?: string;
    bio: string;
    avatarUrl: string;
  };
};

export function CustomerProfileForm({ initialProfile }: CustomerProfileFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatarUrl);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setIsSaving(true);
    try {
      await customerApi.updateCustomerProfile(formData);
      toast.success("Profile saved successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Save failed";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-12">
      <input type="hidden" name="avatarUrl" value={avatarUrl} />

      <div className="min-w-0 space-y-6 lg:col-span-9">
        <Card className="min-w-0 overflow-visible rounded-lg gap-0">
          <CardHeader className="border-b gap-0 pb-0">
            <CardTitle>Thông tin hồ sơ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 p-5 md:p-6">
            <section className="space-y-5">
              <div className="border-b pb-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Danh tính</p>
                <h3 className="mt-1 text-lg font-semibold">Tên hiển thị</h3>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="fullName" className="font-medium">
                    Full name
                  </label>
                  <Input id="fullName" name="fullName" defaultValue={initialProfile.fullName} placeholder="Nguyen Van A" />
                </div>

                <div className="space-y-2">
                  <label htmlFor="displayName" className="font-medium">
                    Display name
                  </label>
                  <Input
                    id="displayName"
                    name="displayName"
                    defaultValue={initialProfile.displayName}
                    placeholder="Pinklove Customer"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-5">
              <div className="border-b pb-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Liên hệ</p>
                <h3 className="mt-1 text-lg font-semibold">Số điện thoại và portal</h3>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="phone" className="font-medium">
                    Phone
                  </label>
                  <Input id="phone" name="phone" defaultValue={initialProfile.phone} placeholder="0901234567" />
                </div>

                {initialProfile.providerPortalSlug ? (
                  <div className="space-y-2">
                    <label htmlFor="providerPortalSlug" className="font-medium">
                      Provider portal slug
                    </label>
                    <Input id="providerPortalSlug" name="providerPortalSlug" defaultValue={initialProfile.providerPortalSlug} readOnly />
                  </div>
                ) : (
                  <input type="hidden" name="providerPortalSlug" value="" />
                )}
              </div>
            </section>

            <section className="space-y-5">
              <div className="border-b pb-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Giới thiệu</p>
                <h3 className="mt-1 text-lg font-semibold">Bio</h3>
              </div>
              <div className="space-y-2">
                <label htmlFor="bio" className="font-medium">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  defaultValue={initialProfile.bio}
                  className="flex min-h-28 w-full rounded-lg border border-input bg-transparent px-3 py-2 outline-none placeholder:text-muted-foreground"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </section>
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
            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save profile"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
