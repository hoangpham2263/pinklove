"use client";

import Link from "next/link";
import type { ComponentType, MouseEventHandler, ReactNode } from "react";
import {
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
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

type AdminTableActionKind =
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

const ACTION_CONFIG: Record<AdminTableActionKind, ActionConfig> = {
  view: { icon: Eye, label: "Xem", tone: "view" },
  edit: { icon: Pencil, label: "Chỉnh sửa", tone: "edit" },
  external: { icon: ExternalLink, label: "Mở liên kết", tone: "external" },
  download: { icon: Download, label: "Tải xuống", tone: "download" },
  delete: { icon: Trash2, label: "Xóa", tone: "delete" },
  save: { icon: Save, label: "Lưu", tone: "save" },
  cancel: { icon: X, label: "Hủy", tone: "cancel" },
  approve: { icon: CheckCircle2, label: "Duyệt", tone: "approve" },
  reject: { icon: XCircle, label: "Từ chối", tone: "reject" },
  spam: { icon: ShieldAlert, label: "Spam", tone: "spam" },
  restore: { icon: RotateCcw, label: "Khôi phục", tone: "restore" },
};

const ACTION_TONE_CLASS: Record<ActionConfig["tone"], string> = {
  view: "border-border bg-background text-foreground hover:bg-muted hover:text-foreground",
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

type AdminTableActionsProps = {
  children: ReactNode;
};

type AdminTableActionButtonProps = {
  action: AdminTableActionKind;
  label?: string;
  href?: string;
  target?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

type AdminTableActionTriggerProps = {
  action: AdminTableActionKind;
  label?: string;
};

export function AdminTableActions({ children }: AdminTableActionsProps) {
  return <div className="flex items-center justify-end gap-2">{children}</div>;
}

function adminTableActionButtonClass(action: AdminTableActionKind) {
  const config = ACTION_CONFIG[action];

  return cn(
    "inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    ACTION_TONE_CLASS[config.tone]
  );
}

function AdminTableActionIcon({ action, title }: { action: AdminTableActionKind; title: string }) {
  const Icon = ACTION_CONFIG[action].icon;

  return (
    <>
      <Icon className="h-4 w-4" />
      <span className="sr-only">{title}</span>
    </>
  );
}

export function AdminTableActionTrigger({ action, label }: AdminTableActionTriggerProps) {
  const title = label ?? ACTION_CONFIG[action].label;

  return (
    <DialogTrigger
      title={title}
      aria-label={title}
      render={
        <button
          type="button"
          className={adminTableActionButtonClass(action)}
        />
      }
    >
      <AdminTableActionIcon action={action} title={title} />
    </DialogTrigger>
  );
}

export function AdminTableActionButton({
  action,
  label,
  href,
  target,
  type = "button",
  disabled,
  onClick,
}: AdminTableActionButtonProps) {
  const title = label ?? ACTION_CONFIG[action].label;
  const buttonClassName = adminTableActionButtonClass(action);

  if (href) {
    return (
      <Link
        href={href}
        target={target}
        title={title}
        aria-label={title}
        className={buttonClassName}
      >
        <AdminTableActionIcon action={action} title={title} />
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={buttonClassName}
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
    >
      <AdminTableActionIcon action={action} title={title} />
    </button>
  );
}
