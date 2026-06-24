"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { AdminOutlineButton, AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import type { OfferingTypeRegistrySyncStatus } from "@/features/offerings/types";
import { cn } from "@/lib/utils";

type OfferingTypeRegistrySyncCardProps = {
  initialStatus: OfferingTypeRegistrySyncStatus;
};

type SyncApiResponse = {
  ok: boolean;
  status: OfferingTypeRegistrySyncStatus;
  message?: string;
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
}

function formatValue(value: string | number | boolean | null) {
  if (value === null || value === "") return "(trống)";
  return String(value);
}

export function OfferingTypeRegistrySyncCard({ initialStatus }: OfferingTypeRegistrySyncCardProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [isChecking, setIsChecking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const issueCount = status.missingInDb.length + status.extraInDb.length + status.metadataDiffs.length;

  async function requestStatus(method: "GET" | "POST") {
    const response = await fetch("/api/admin/offerings/types/registry-sync", {
      method,
      headers: { Accept: "application/json" },
    });
    const result = (await response.json()) as SyncApiResponse;
    if (!response.ok || !result.ok) {
      throw new Error(result.message ?? "Không thể kiểm tra sync offering types.");
    }
    setStatus(result.status);
    return result;
  }

  async function handleCheck() {
    setIsChecking(true);
    try {
      const result = await requestStatus("GET");
      toast.success(result.status.isSynced ? "Code và DB đang khớp." : "Đã kiểm tra, còn lệch code/DB.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể kiểm tra sync offering types.");
    } finally {
      setIsChecking(false);
    }
  }

  async function handleSync() {
    setIsSyncing(true);
    try {
      const result = await requestStatus("POST");
      toast.success(result.message ?? "Đã đồng bộ offering types.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể đồng bộ offering types.");
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <section className="rounded-lg border bg-white p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-medium">Code registry ↔ DB sync</h2>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium",
                status.isSynced ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              )}
            >
              {status.isSynced ? "Đã khớp" : `Còn ${issueCount} lệch`}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            So sánh system offering types trong code registry với bảng <code>offering_types</code>. Field definitions không nằm trong
            kiểm tra này.
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>Code: {status.codeKeys.length} type</span>
            <span>DB: {status.dbKeys.length} type</span>
            <span>Kiểm tra: {formatTime(status.checkedAt)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <AdminOutlineButton type="button" onClick={() => void handleCheck()} disabled={isChecking || isSyncing}>
            {isChecking ? "Đang kiểm tra..." : "Kiểm tra lại"}
          </AdminOutlineButton>
          <AdminSubmitButton type="button" onClick={() => void handleSync()} disabled={isChecking || isSyncing || status.isSynced}>
            {isSyncing ? "Đang đồng bộ..." : "Đồng bộ DB từ code"}
          </AdminSubmitButton>
        </div>
      </div>

      {!status.isSynced && (
        <div className="mt-4 grid gap-3 text-sm lg:grid-cols-3">
          <div className="rounded-md border bg-stone-50 p-3">
            <div className="font-medium">Thiếu trong DB</div>
            <div className="mt-2 text-muted-foreground">{status.missingInDb.length ? status.missingInDb.join(", ") : "Không có"}</div>
          </div>
          <div className="rounded-md border bg-stone-50 p-3">
            <div className="font-medium">Thừa trong DB</div>
            <div className="mt-2 text-muted-foreground">{status.extraInDb.length ? status.extraInDb.join(", ") : "Không có"}</div>
          </div>
          <div className="rounded-md border bg-stone-50 p-3">
            <div className="font-medium">Metadata lệch</div>
            <div className="mt-2 space-y-1 text-muted-foreground">
              {status.metadataDiffs.length ? (
                status.metadataDiffs.slice(0, 4).map((diff) => (
                  <div key={`${diff.key}-${diff.field}`}>
                    <span className="font-mono">{diff.key}</span> {diff.field}: code {formatValue(diff.codeValue)}, DB{" "}
                    {formatValue(diff.dbValue)}
                  </div>
                ))
              ) : (
                "Không có"
              )}
              {status.metadataDiffs.length > 4 && <div>+{status.metadataDiffs.length - 4} lệch khác</div>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
