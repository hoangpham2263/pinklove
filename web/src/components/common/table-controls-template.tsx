"use client";

import { ArrowUpDown } from "lucide-react";
import type { ReactNode } from "react";

import type { TableActionKind } from "@/components/common/table-actions-template";
import { cn } from "@/lib/utils";

export type TableToolbarTemplateProps = {
  children: ReactNode;
  contentClassName?: string;
};

export type TableSearchTemplateProps = {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  className?: string;
};

export type TableSelectTemplateOption = {
  value: string;
  label: string;
};

export type TableSelectTemplateProps = {
  value: string;
  label: string;
  options: TableSelectTemplateOption[];
  onChange: (value: string) => void;
  className?: string;
};

export type TableClearButtonTemplateProps = {
  visible: boolean;
  onClick: () => void;
  actionButton: (props: { action: TableActionKind; label: string; onClick: () => void }) => ReactNode;
};

export type TableSortButtonTemplateProps = {
  children: ReactNode;
  align?: "left" | "right";
  onClick: () => void;
};

const controlClassName =
  "h-9 rounded-lg border border-input bg-white px-3 text-sm outline-none transition-colors";

export function TableToolbarTemplate({ children, contentClassName }: TableToolbarTemplateProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className={cn("flex flex-wrap items-center gap-3", contentClassName)}>{children}</div>
    </div>
  );
}

export function TableSearchTemplate({ value, placeholder, onChange, className }: TableSearchTemplateProps) {
  return (
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={cn(controlClassName, "w-full min-w-0 md:w-80", className)}
    />
  );
}

export function TableSelectTemplate({ value, label, options, onChange, className }: TableSelectTemplateProps) {
  return (
    <select
      value={value}
      aria-label={label}
      onChange={(event) => onChange(event.target.value)}
      className={cn(controlClassName, "w-full md:w-56", className)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function TableClearButtonTemplate({ visible, onClick, actionButton }: TableClearButtonTemplateProps) {
  if (!visible) {
    return null;
  }

  return actionButton({ action: "clear", label: "Xóa bộ lọc", onClick });
}

export function TableSortButtonTemplate({ children, align = "left", onClick }: TableSortButtonTemplateProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg bg-white px-2 text-sm outline-none transition-colors hover:bg-muted",
        align === "left" ? "-ml-2" : ""
      )}
    >
      {children}
      <ArrowUpDown className="h-4 w-4" />
    </button>
  );
}
