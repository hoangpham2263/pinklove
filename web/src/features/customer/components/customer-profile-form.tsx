"use client";

import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { customerApi } from "@/lib/api-client.customer";

type CustomerProfileFormProps = {
  initialProfile: {
    fullName: string;
    displayName: string;
    phone: string;
    vendorPortalSlug?: string;
    bio: string;
  };
};

export function CustomerProfileForm({ initialProfile }: CustomerProfileFormProps) {
  const [isSaving, setIsSaving] = useState(false);

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
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

      <div className="space-y-2">
        <label htmlFor="phone" className="font-medium">
          Phone
        </label>
        <Input id="phone" name="phone" defaultValue={initialProfile.phone} placeholder="0901234567" />
      </div>

      {initialProfile.vendorPortalSlug ? (
        <div className="space-y-2">
          <label htmlFor="vendorPortalSlug" className="font-medium">
            Vendor portal slug
          </label>
          <Input id="vendorPortalSlug" name="vendorPortalSlug" defaultValue={initialProfile.vendorPortalSlug} readOnly />
        </div>
      ) : (
        <input type="hidden" name="vendorPortalSlug" value="" />
      )}

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

      <Button type="submit" disabled={isSaving}>
        {isSaving ? "Saving..." : "Save profile"}
      </Button>
    </form>
  );
}
