"use client";

import { useRouter } from "next/navigation";
import { ExternalLink, KeyRound, Link2, Shapes } from "lucide-react";
import { toast } from "sonner";

import { useConfirm } from "@/components/common/confirm-provider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminCreateLinkButton } from "@/features/admin/components/admin-buttons";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { AdminTableActionButton, AdminTableActions } from "@/features/admin/components/admin-table-actions";
import { adminApi } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import { type InternalAccount } from "@/lib/internal-accounts";
import { ROUTES } from "@/lib/routes";

type InternalAccountsManagerProps = {
  accounts: InternalAccount[];
};

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("vi-VN");
}

export function InternalAccountsManager({ accounts }: InternalAccountsManagerProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const accountsWithUrl = accounts.filter((account) => account.loginUrl.trim().length > 0).length;
  const platformCount = new Set(accounts.map((account) => account.platform.trim().toLowerCase()).filter(Boolean)).size;

  async function handleDelete(account: InternalAccount) {
    const approved = await confirm({
      title: "Xóa tài khoản nội bộ",
      description: `Bạn có chắc chắn muốn xóa tài khoản "${account.label}"?`,
      confirmText: "Xóa",
      cancelText: "Hủy",
      variant: "destructive",
    });
    if (!approved) return;

    const formData = new FormData();
    formData.set("id", account.id);
    try {
      const result = await adminApi.removeInternalAccount(formData);
      toast.success(result.message ?? "Đã xóa tài khoản nội bộ.");
      finishMutation(router, result, { redirect: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa tài khoản nội bộ.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Tài khoản nội bộ</h1>
        <AdminCreateLinkButton href={ROUTES.ADMIN.INTERNAL_ACCOUNT_NEW}>Thêm tài khoản</AdminCreateLinkButton>
      </div>

      <AdminOverviewGrid className="md:grid-cols-3 lg:grid-cols-3">
        <AdminOverviewCard title="Tổng tài khoản" value={accounts.length} icon={KeyRound} />
        <AdminOverviewCard title="Có link mở nhanh" value={accountsWithUrl} icon={Link2} />
        <AdminOverviewCard title="Nền tảng đang lưu" value={platformCount} icon={Shapes} />
      </AdminOverviewGrid>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nền tảng</TableHead>
              <TableHead>Tên tài khoản</TableHead>
              <TableHead>Đăng nhập</TableHead>
              <TableHead>Mật khẩu</TableHead>
              <TableHead>Link</TableHead>
              <TableHead>Ghi chú</TableHead>
              <TableHead>Thứ tự</TableHead>
              <TableHead>Cập nhật</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                  Chưa có tài khoản nội bộ nào được lưu.
                </TableCell>
              </TableRow>
            ) : null}

            {accounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell className="font-medium">{account.platform}</TableCell>
                <TableCell>{account.label}</TableCell>
                <TableCell>{account.loginUsername || <span className="text-muted-foreground">-</span>}</TableCell>
                <TableCell>{account.loginPassword ? "••••••••" : <span className="text-muted-foreground">-</span>}</TableCell>
                <TableCell>
                  {account.loginUrl ? (
                    <a
                      href={account.loginUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      Mở nhanh
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="max-w-64 truncate">{account.notes || <span className="text-muted-foreground">-</span>}</TableCell>
                <TableCell>{account.sortOrder}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDateTime(account.updatedAt)}</TableCell>
                <TableCell>
                  <AdminTableActions>
                    <AdminTableActionButton
                      action="edit"
                      label={`Sửa ${account.label}`}
                      href={ROUTES.ADMIN.INTERNAL_ACCOUNT(account.id)}
                    />
                    <AdminTableActionButton
                      action="delete"
                      label={`Xóa ${account.label}`}
                      onClick={() => void handleDelete(account)}
                    />
                  </AdminTableActions>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
