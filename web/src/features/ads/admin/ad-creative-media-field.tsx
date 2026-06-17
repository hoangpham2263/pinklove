"use client";

import { useState } from "react";

import { AdminField, AdminInput } from "@/features/admin/components/admin-form";
import { MediaSelector } from "@/features/media/components/media-selector";

type AdCreativeMediaFieldProps = {
  name: string;
  label: string;
  required?: boolean;
};

export function AdCreativeMediaField({ name, label, required }: AdCreativeMediaFieldProps) {
  const [value, setValue] = useState("");

  return (
    <AdminField label={label} required={required}>
      <div className="grid gap-2">
        <MediaSelector name={name} value={value} onChange={setValue} compact />
        <AdminInput
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="/uploads/..."
          required={required}
        />
      </div>
    </AdminField>
  );
}
