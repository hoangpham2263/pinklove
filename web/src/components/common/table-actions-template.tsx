"use client";

import Link from "next/link";
import type { ComponentType, MouseEventHandler, ReactNode } from "react";
import {
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  FilterX,
  Pencil,
  RotateCcw,
  Save,
  ShieldAlert,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

import { DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type TableActionKind =
  | "view"
  | "edit"
  | "external"
  | "download"
  | "clear"
  | "delete"
  | "save"
  | "cancel"
  | "approve"
  | "reject"
  | "spam"
  | "restore";

type ActionConfig = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  tone:
    | "view"
    | "edit"
    | "external"
    | "download"
    | "delete"
    | "save"
    | "cancel"
    | "approve"
    | "reject"
    | "spam"
    | "restore";
};

const ACTION_CONFIG: Record<TableActionKind, ActionConfig> = {
  view: { icon: Eye, label: "Xem", tone: "view" },
  edit: { icon: Pencil, label: "Chỉnh sửa", tone: "edit" },
  external: { icon: ExternalLink, label: "Mở liên kết", tone: "external" },
  download: { icon: Download, label: "Tải xuống", tone: "download" },
  clear: { icon: FilterX, label: "Xóa bộ lọc", tone: "delete" },
  delete: { icon: Trash2, label: "Xóa", tone: "delete" },
  save: { icon: Save, label: "Lưu", tone: "save" },
  cancel: { icon: X, label: "Hủy", tone: "cancel" },
  approve: { icon: CheckCircle2, label: "Duyệt", tone: "approve" },
  reject: { icon: XCircle, label: "Từ chối", tone: "reject" },
  spam: { icon: ShieldAlert, label: "Spam", tone: "spam" },
  restore: { icon: RotateCcw, label: "Khôi phục", tone: "restore" },
};

const ACTION_TONE_CLASS: Record<ActionConfig["tone"], string> = {
  view: "border-border bg-white text-foreground hover:bg-muted hover:text-foreground",
  edit: "border-blue-400/60 bg-blue-50 text-blue-700 hover:bg-blue-100",
  external: "border-teal-400/60 bg-teal-50 text-teal-700 hover:bg-teal-100",
  download: "border-violet-400/60 bg-violet-50 text-violet-700 hover:bg-violet-100",
  delete: "border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive/20",
  save: "border-emerald-400/60 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  cancel: "border-neutral-400/60 bg-neutral-50 text-neutral-700 hover:bg-neutral-100",
  approve: "border-green-400/60 bg-green-50 text-green-700 hover:bg-green-100",
  reject: "border-rose-400/60 bg-rose-50 text-rose-700 hover:bg-rose-100",
  spam: "border-orange-400/60 bg-orange-50 text-orange-700 hover:bg-orange-100",
  restore: "border-amber-400/60 bg-amber-50 text-amber-700 hover:bg-amber-100",
};

export type TableActionsProps = {
  children: ReactNode;
};

export type TableActionButtonProps = {
  action: TableActionKind;
  label?: string;
  href?: string;
  target?: string;
  type?: "button" | "submit" | "reset";
  name?: string;
  value?: string;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

export type TableActionTriggerProps = {
  action: TableActionKind;
  label?: string;
};

export function TableActionsTemplate({ children }: TableActionsProps) {
  return <div className="flex flex-wrap items-center justify-end gap-2">{children}</div>;
}

function tableActionButtonClass(action: TableActionKind) {
  const config = ACTION_CONFIG[action];

  return cn(
    "inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border outline-none transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    ACTION_TONE_CLASS[config.tone]
  );
}

function TableActionIcon({ action, title }: { action: TableActionKind; title: string }) {
  const Icon = ACTION_CONFIG[action].icon;

  return (
    <>
      <Icon className="h-4 w-4" />
      <span className="sr-only">{title}</span>
    </>
  );
}

export function TableActionTriggerTemplate({ action, label }: TableActionTriggerProps) {
  const title = label ?? ACTION_CONFIG[action].label;

  return (
    <DialogTrigger
      aria-label={title}
      render={<button type="button" data-action-tooltip={title} className={tableActionButtonClass(action)} />}
    >
      <TableActionIcon action={action} title={title} />
    </DialogTrigger>
  );
}

export function TableActionButtonTemplate({
  action,
  label,
  href,
  target,
  type = "button",
  name,
  value,
  disabled,
  onClick,
}: TableActionButtonProps) {
  const title = label ?? ACTION_CONFIG[action].label;
  const buttonClassName = tableActionButtonClass(action);

  if (href) {
    return (
      <Link
        href={href}
        target={target}
        aria-label={title}
        data-action-tooltip={title}
        className={buttonClassName}
      >
        <TableActionIcon action={action} title={title} />
      </Link>
    );
  }

  return (
    <button
      type={type}
      name={name}
      value={value}
      className={buttonClassName}
      aria-label={title}
      data-action-tooltip={title}
      disabled={disabled}
      onClick={onClick}
    >
      <TableActionIcon action={action} title={title} />
    </button>
  );
}
