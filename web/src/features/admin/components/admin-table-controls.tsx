"use client";

import { FilterX } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AdminTableToolbarProps = {
  children: ReactNode;
};

type AdminTableSearchProps = {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
};

type AdminTableSelectOption = {
  value: string;
  label: string;
};

type AdminTableSelectProps = {
  value: string;
  label: string;
  options: AdminTableSelectOption[];
  onChange: (value: string) => void;
};

type AdminTableClearButtonProps = {
  visible: boolean;
  onClick: () => void;
};

const controlClassName =
  "h-9 rounded-lg border border-input bg-white px-3 text-sm transition-colors";

export function AdminTableToolbar({ children }: AdminTableToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

export function AdminTableSearch({ value, placeholder, onChange }: AdminTableSearchProps) {
  return (
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={cn(controlClassName, "w-full min-w-0 md:w-80")}
    />
  );
}

export function AdminTableSelect({ value, label, options, onChange }: AdminTableSelectProps) {
  return (
    <select
      value={value}
      aria-label={label}
      onChange={(event) => onChange(event.target.value)}
      className={cn(controlClassName, "w-full md:w-56")}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function AdminTableClearButton({ visible, onClick }: AdminTableClearButtonProps) {
  if (!visible) {
    return null;
  }

  return (
    <button
      type="button"
      aria-label="Xóa bộ lọc"
      title="Xóa bộ lọc"
      onClick={onClick}
      className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-white text-foreground transition-colors hover:bg-muted"
    >
      <FilterX className="h-4 w-4" />
    </button>
  );
}
