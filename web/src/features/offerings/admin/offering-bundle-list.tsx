"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { NativeForm } from "@/components/common/native-form";
import { useConfirm } from "@/components/common/confirm-provider";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminTableActionButton, AdminTableActions } from "@/features/admin/components/admin-table-actions";
import type { OfferingBundle } from "@/features/offerings/server/bundles";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import { ROUTES } from "@/lib/routes";

const statusLabels: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

function formatMoney(value: number, currency = "VND") {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "VND" ? 0 : 2,
  }).format(value);
}

function formatDateTime(value: string) {
  return new Date(value).toISOString().slice(0, 16).replace("T", " ");
}

export function OfferingBundleList({ bundles }: { bundles: OfferingBundle[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [deletingSlug, setDeletingSlug] = useState("");

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tên combo</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Giá</TableHead>
            <TableHead className="text-right">Số mục</TableHead>
            <TableHead>Cập nhật</TableHead>
            <TableHead className="text-right">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bundles.length ? (
            bundles.map((bundle) => (
              <TableRow key={bundle.id}>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium">{bundle.name}</p>
                    <p className="text-xs text-muted-foreground">/{bundle.slug}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={bundle.status === "published" ? "default" : "secondary"}>
                    {statusLabels[bundle.status] ?? bundle.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{formatMoney(bundle.price, bundle.currency)}</TableCell>
                <TableCell className="text-right">{bundle.itemCount}</TableCell>
                <TableCell>{formatDateTime(bundle.updatedAt)}</TableCell>
                <TableCell>
                  <AdminTableActions>
                    <AdminTableActionButton
                      action="edit"
                      label="Chỉnh sửa combo"
                      href={ROUTES.ADMIN.OFFERING_BUNDLE(bundle.slug)}
                    />
                    <NativeForm
                      action={adminApiActions.deleteOfferingBundle}
                      method="POST"
                      onSubmit={async (event) => {
                        event.preventDefault();
                        const isConfirmed = await confirm({
                          title: "Xóa combo",
                          description: `Bạn có chắc chắn muốn xóa combo: ${bundle.name}?`,
                          confirmText: "Xóa",
                          cancelText: "Hủy",
                          variant: "destructive",
                        });
                        if (!isConfirmed) {
                          return;
                        }

                        setDeletingSlug(bundle.slug);
                        try {
                          const result = await adminApi.deleteOfferingBundle(new FormData(event.currentTarget));
                          toast.success(result.message ?? "Đã xóa combo.");
                          finishMutation(router, result, { redirect: false });
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Không thể xóa combo.");
                        } finally {
                          setDeletingSlug("");
                        }
                      }}
                    >
                      <input type="hidden" name="slug" value={bundle.slug} />
                      <AdminTableActionButton
                        action="delete"
                        label={deletingSlug === bundle.slug ? "Đang xóa combo" : "Xóa combo"}
                        type="submit"
                        disabled={deletingSlug === bundle.slug}
                      />
                    </NativeForm>
                  </AdminTableActions>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                Chưa có combo nào.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
