"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArchiveRestore, Download, Loader2, RotateCcw, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AdminBackupPackage } from "@/lib/admin-backups";
import { ROUTES } from "@/lib/routes";

type AdminBackupsManagerProps = {
  packages: AdminBackupPackage[];
  directory: string;
};

type ProcessState = {
  action: string;
  title: string;
  description: string;
};

type ActionTooltipProps = {
  label: string;
  children: ReactNode;
};

type TooltipPosition = {
  top: number;
  left: number;
};

const processCopy: Record<string, Omit<ProcessState, "action">> = {
  create: {
    title: "Creating backup",
    description: "Đang dump database, nén uploads và tạo checksum. Không đóng trang cho đến khi hoàn tất.",
  },
  upload: {
    title: "Uploading backup",
    description: "Đang tải package lên thư viện backup và tạo checksum.",
  },
  restore: {
    title: "Restoring backup",
    description: "Đang restore database và uploads. Dữ liệu hiện tại sẽ được thay bằng bản đã chọn.",
  },
  delete: {
    title: "Deleting backup",
    description: "Đang xoá package khỏi thư viện backup.",
  },
};

const REQUEST_START_DELAY_MS = 450;
const MIN_PROCESS_VISIBLE_MS = 1200;

function formatBytes(value: number) {
  if (value === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const amount = value / 1024 ** exponent;

  return `${amount >= 10 || exponent === 0 ? amount.toFixed(0) : amount.toFixed(1)} ${units[exponent]}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

async function parseActionResponse(response: Response) {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload?.ok === false) {
    throw new Error(String(payload?.message || "Thao tác thất bại."));
  }

  return payload as { message?: string };
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function ActionTooltip({ label, children }: ActionTooltipProps) {
  const [position, setPosition] = useState<TooltipPosition | null>(null);

  function showTooltip(element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    setPosition({
      top: rect.top - 8,
      left: rect.left + rect.width / 2,
    });
  }

  return (
    <span
      className="inline-flex"
      onMouseEnter={(event) => showTooltip(event.currentTarget)}
      onMouseLeave={() => setPosition(null)}
      onFocus={(event) => showTooltip(event.currentTarget)}
      onBlur={() => setPosition(null)}
    >
      {children}
      {position ? (
        <span
          className="pointer-events-none fixed z-[90] -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border bg-foreground px-2 py-1 text-xs text-background shadow-lg"
          style={{ top: position.top, left: position.left }}
        >
          {label}
        </span>
      ) : null}
    </span>
  );
}

export function AdminBackupsManager({ packages, directory }: AdminBackupsManagerProps) {
  const router = useRouter();
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const actionLockRef = useRef(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [processState, setProcessState] = useState<ProcessState | null>(null);
  const [processProgress, setProcessProgress] = useState(0);
  const [restorePackage, setRestorePackage] = useState<AdminBackupPackage | null>(null);
  const [deletePackage, setDeletePackage] = useState<AdminBackupPackage | null>(null);
  const [restoreConfirm, setRestoreConfirm] = useState("");
  const [isRefreshing, startRefresh] = useTransition();

  const restoreDisabled = restoreConfirm !== "RESTORE" || pendingAction === "restore";
  const restoreCommand = useMemo(
    () => (restorePackage ? `./scripts/restore.sh web/data/backups/${restorePackage.name}` : ""),
    [restorePackage]
  );
  const isBusy = Boolean(processState);

  useEffect(() => {
    if (!processState) {
      setProcessProgress(0);
      return;
    }

    setProcessProgress(8);
    const interval = window.setInterval(() => {
      setProcessProgress((current) => {
        if (current >= 92) return current;
        const nextStep = current < 35 ? 7 : current < 70 ? 4 : 1;
        return Math.min(current + nextStep, 92);
      });
    }, 500);

    return () => window.clearInterval(interval);
  }, [processState]);

  function refreshPage() {
    startRefresh(() => router.refresh());
  }

  async function runAction(action: string, request: () => Promise<Response>, successMessage: string) {
    if (actionLockRef.current) {
      return;
    }

    actionLockRef.current = true;
    setPendingAction(action);
    const baseAction = action.split(":")[0] || action;
    const copy = processCopy[baseAction] || {
      title: "Processing",
      description: "Đang xử lý thao tác backup.",
    };
    setProcessState({ action: baseAction, ...copy });
    const startedAt = Date.now();

    try {
      await sleep(REQUEST_START_DELAY_MS);
      const result = await parseActionResponse(await request());
      const visibleDuration = Date.now() - startedAt;
      if (visibleDuration < MIN_PROCESS_VISIBLE_MS) {
        await sleep(MIN_PROCESS_VISIBLE_MS - visibleDuration);
      }
      setProcessProgress(100);
      toast.success(result.message || successMessage);
      refreshPage();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Thao tác thất bại.");
    } finally {
      window.setTimeout(() => {
        setPendingAction(null);
        setProcessState(null);
        actionLockRef.current = false;
      }, 350);
    }
  }

  async function handleUpload(file: File | undefined) {
    if (!file) return;

    const formData = new FormData();
    formData.set("file", file);

    await runAction(
      "upload",
      () =>
        fetch(ROUTES.API.ADMIN.CONFIG.BACKUPS_UPLOAD, {
          method: "POST",
          body: formData,
        }),
      "Đã upload backup."
    );

    if (uploadInputRef.current) {
      uploadInputRef.current.value = "";
    }
  }

  async function handleRestore() {
    if (!restorePackage) return;

    await runAction(
      "restore",
      () =>
        fetch(ROUTES.API.ADMIN.CONFIG.BACKUPS_RESTORE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: restorePackage.name, confirmation: restoreConfirm }),
        }),
      "Đã restore backup."
    );

    setRestorePackage(null);
    setRestoreConfirm("");
  }

  async function handleDelete() {
    if (!deletePackage) return;

    const packageName = deletePackage.name;

    await runAction(
      `delete:${packageName}`,
      () =>
        fetch(ROUTES.API.ADMIN.CONFIG.BACKUPS_DELETE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: packageName }),
        }),
      "Đã xóa backup."
    );

    setDeletePackage(null);
  }

  return (
    <>
      <Card className="rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b">
          <CardTitle>Backup Library</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              ref={uploadInputRef}
              type="file"
              accept=".tar.gz,application/gzip,application/x-gzip"
              className="hidden"
              onChange={(event) => void handleUpload(event.target.files?.[0])}
            />
            <Button
              variant="outline"
              className="bg-white"
              disabled={isBusy}
              onClick={() => uploadInputRef.current?.click()}
            >
              {pendingAction === "upload" ? <Loader2 className="animate-spin" /> : <Upload />}
              Upload
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isBusy || isRefreshing}
              onClick={() =>
                void runAction(
                  "create",
                  () => fetch(ROUTES.API.ADMIN.CONFIG.BACKUPS_CREATE, { method: "POST" }),
                  "Đã tạo backup."
                )
              }
            >
              {pendingAction === "create" ? <Loader2 className="animate-spin" /> : <RotateCcw />}
              Create
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {packages.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map((item) => (
                  <TableRow key={item.name}>
                    <TableCell>
                      <div className="font-medium text-foreground">{item.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{directory}</div>
                    </TableCell>
                    <TableCell>{formatDate(item.createdAt)}</TableCell>
                    <TableCell>{formatBytes(item.size)}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2 rounded-lg border bg-white px-2.5 py-1 text-xs">
                        {item.checksum ? "Checksum ready" : "No checksum"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <ActionTooltip label="Download backup package">
                          <Button
                            variant="outline"
                            size="icon-sm"
                            className="h-8 w-8 bg-white"
                            aria-label={`Download ${item.name}`}
                            render={
                              <a href={ROUTES.API.ADMIN.CONFIG.BACKUPS_DOWNLOAD(item.name)}>
                                <Download />
                                <span className="sr-only">Download</span>
                              </a>
                            }
                          />
                        </ActionTooltip>
                        <ActionTooltip label="Restore this backup">
                          <Button
                            variant="outline"
                            size="icon-sm"
                            className="h-8 w-8 bg-white"
                            aria-label={`Restore ${item.name}`}
                            onClick={() => setRestorePackage(item)}
                          >
                            <ArchiveRestore />
                            <span className="sr-only">Restore</span>
                          </Button>
                        </ActionTooltip>
                        <ActionTooltip label="Delete backup package">
                          <Button
                            variant="destructive"
                            size="icon-sm"
                            className="h-8 w-8 border border-destructive/50"
                            aria-label={`Delete ${item.name}`}
                            disabled={isBusy}
                            onClick={() => setDeletePackage(item)}
                          >
                            {pendingAction === `delete:${item.name}` ? <Loader2 className="animate-spin" /> : <Trash2 />}
                            <span className="sr-only">Delete</span>
                          </Button>
                        </ActionTooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="rounded-b-lg border-dashed px-4 py-10 text-center text-muted-foreground">
              Chưa có backup package. Tạo backup mới hoặc upload file `.tar.gz` đã tải về trước đó.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(restorePackage)}
        onOpenChange={(open) => {
          if (!open && !isBusy) {
            setRestorePackage(null);
            setRestoreConfirm("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore backup</DialogTitle>
            <DialogDescription>
              Restore sẽ ghi đè database hiện tại và thư mục uploads bằng dữ liệu trong package đã chọn.
            </DialogDescription>
          </DialogHeader>
          {restorePackage ? (
            <div className="space-y-4">
              <div className="rounded-lg border bg-white p-4">
                <p className="font-medium">{restorePackage.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDate(restorePackage.createdAt)} · {formatBytes(restorePackage.size)}
                </p>
                <code className="mt-3 block overflow-x-auto rounded-lg bg-muted px-3 py-2 text-xs">{restoreCommand}</code>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="restore-confirm">
                  Gõ RESTORE để xác nhận
                </label>
                <Input
                  id="restore-confirm"
                  value={restoreConfirm}
                  onChange={(event) => setRestoreConfirm(event.target.value)}
                  className="bg-white"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" className="bg-white" disabled={isBusy} onClick={() => setRestorePackage(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" disabled={restoreDisabled} onClick={() => void handleRestore()}>
                  {pendingAction === "restore" ? <Loader2 className="animate-spin" /> : <ArchiveRestore />}
                  Restore
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deletePackage)}
        onOpenChange={(open) => {
          if (!open && !isBusy) {
            setDeletePackage(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete backup</DialogTitle>
            <DialogDescription>
              Backup package này sẽ bị xoá khỏi thư viện. File đã xoá sẽ không thể restore từ admin nữa.
            </DialogDescription>
          </DialogHeader>
          {deletePackage ? (
            <div className="space-y-4">
              <div className="rounded-lg border bg-white p-4">
                <p className="font-medium">{deletePackage.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDate(deletePackage.createdAt)} · {formatBytes(deletePackage.size)}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" className="bg-white" disabled={isBusy} onClick={() => setDeletePackage(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" disabled={isBusy} onClick={() => void handleDelete()}>
                  {pendingAction === `delete:${deletePackage.name}` ? <Loader2 className="animate-spin" /> : <Trash2 />}
                  Delete
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {processState ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border bg-background p-5 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-white">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{processState.title}</p>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">{processState.description}</p>
              </div>
              <div className="text-sm tabular-nums text-muted-foreground">{processProgress}%</div>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${processProgress}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>Processing request</span>
              <span>Do not close this page</span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
