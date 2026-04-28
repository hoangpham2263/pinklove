"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { NativeForm } from "@/components/common/native-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import { type InternalAccount } from "@/lib/internal-accounts";
import { ROUTES } from "@/lib/routes";

type InternalAccountsManagerProps = {
  accounts: InternalAccount[];
};

type DraftAccount = {
  platform: string;
  label: string;
  loginUsername: string;
  loginPassword: string;
  loginUrl: string;
  notes: string;
  sortOrder: string;
};

const EMPTY_DRAFT: DraftAccount = {
  platform: "",
  label: "",
  loginUsername: "",
  loginPassword: "",
  loginUrl: "",
  notes: "",
  sortOrder: "0",
};

function toDraft(account: InternalAccount): DraftAccount {
  return {
    platform: account.platform,
    label: account.label,
    loginUsername: account.loginUsername,
    loginPassword: account.loginPassword,
    loginUrl: account.loginUrl,
    notes: account.notes,
    sortOrder: String(account.sortOrder),
  };
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("vi-VN");
}

export function InternalAccountsManager({ accounts }: InternalAccountsManagerProps) {
  const router = useRouter();
  const [createDraft, setCreateDraft] = useState<DraftAccount>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<DraftAccount>(EMPTY_DRAFT);

  const accountsWithUrl = useMemo(
    () => accounts.filter((account) => account.loginUrl.trim().length > 0).length,
    [accounts]
  );

  function resetCreateDraft() {
    setCreateDraft(EMPTY_DRAFT);
  }

  function startEditing(account: InternalAccount) {
    setEditingId(account.id);
    setEditDraft(toDraft(account));
  }

  function cancelEditing() {
    setEditingId(null);
    setEditDraft(EMPTY_DRAFT);
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const result = await adminApi.saveInternalAccount(new FormData(event.currentTarget));
      toast.success(result.message ?? "Đã thêm tài khoản nội bộ.");
      resetCreateDraft();
      finishMutation(router, result, { redirect: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể thêm tài khoản nội bộ.");
    }
  }

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const result = await adminApi.saveInternalAccount(new FormData(event.currentTarget));
      toast.success(result.message ?? "Đã cập nhật tài khoản nội bộ.");
      cancelEditing();
      finishMutation(router, result, { redirect: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật tài khoản nội bộ.");
    }
  }

  async function handleDelete(event: React.FormEvent<HTMLFormElement>, label: string) {
    event.preventDefault();

    if (!confirm(`Xóa tài khoản "${label}"?`)) {
      return;
    }

    try {
      const result = await adminApi.removeInternalAccount(new FormData(event.currentTarget));
      toast.success(result.message ?? "Đã xóa tài khoản nội bộ.");
      if (editingId) {
        cancelEditing();
      }
      finishMutation(router, result, { redirect: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa tài khoản nội bộ.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-background p-4">
          <p className="text-sm text-muted-foreground">Tổng tài khoản</p>
          <p className="mt-2 text-3xl font-semibold">{accounts.length}</p>
        </div>
        <div className="rounded-lg border bg-background p-4">
          <p className="text-sm text-muted-foreground">Có link mở nhanh</p>
          <p className="mt-2 text-3xl font-semibold">{accountsWithUrl}</p>
        </div>
        <div className="rounded-lg border bg-background p-4">
          <p className="text-sm text-muted-foreground">Nền tảng đang lưu</p>
          <p className="mt-2 text-3xl font-semibold">
            {new Set(accounts.map((account) => account.platform.trim().toLowerCase()).filter(Boolean)).size}
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-background p-4 md:p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Thêm tài khoản mới</h2>
          <p className="text-sm text-muted-foreground">
            Lưu nhanh tài khoản Facebook, TikTok, Zalo, email, BM hoặc bất kỳ tài khoản nội bộ nào cần tra cứu.
          </p>
        </div>

        <NativeForm
          action={adminApiActions.saveInternalAccount}
          method="POST"
          className="grid gap-3 md:grid-cols-2 lg:grid-cols-4"
          onSubmit={handleCreate}
        >
          <Input
            name="platform"
            placeholder="Nền tảng"
            value={createDraft.platform}
            onChange={(event) => setCreateDraft((current) => ({ ...current, platform: event.target.value }))}
            required
          />
          <Input
            name="label"
            placeholder="Tên tài khoản"
            value={createDraft.label}
            onChange={(event) => setCreateDraft((current) => ({ ...current, label: event.target.value }))}
            required
          />
          <Input
            name="loginUsername"
            placeholder="Email / username / số điện thoại"
            value={createDraft.loginUsername}
            onChange={(event) => setCreateDraft((current) => ({ ...current, loginUsername: event.target.value }))}
          />
          <Input
            name="loginPassword"
            placeholder="Mật khẩu"
            value={createDraft.loginPassword}
            onChange={(event) => setCreateDraft((current) => ({ ...current, loginPassword: event.target.value }))}
          />
          <Input
            name="loginUrl"
            placeholder="Link đăng nhập hoặc trang quản trị"
            value={createDraft.loginUrl}
            onChange={(event) => setCreateDraft((current) => ({ ...current, loginUrl: event.target.value }))}
          />
          <Input
            name="sortOrder"
            type="number"
            placeholder="Thứ tự"
            value={createDraft.sortOrder}
            onChange={(event) => setCreateDraft((current) => ({ ...current, sortOrder: event.target.value }))}
          />
          <Input
            name="notes"
            placeholder="Ghi chú"
            value={createDraft.notes}
            onChange={(event) => setCreateDraft((current) => ({ ...current, notes: event.target.value }))}
            className="md:col-span-2 lg:col-span-2"
          />
          <div className="flex items-center gap-2 md:col-span-2 lg:col-span-4">
            <Button type="submit">
              <Plus className="h-4 w-4" />
              Thêm tài khoản
            </Button>
            <Button type="button" variant="outline" onClick={resetCreateDraft}>
              <X className="h-4 w-4" />
              Xóa form
            </Button>
          </div>
        </NativeForm>
      </div>

      <div className="overflow-hidden rounded-lg border bg-background">
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

            {accounts.map((account) => {
              const isEditing = editingId === account.id;
              const currentDraft = isEditing ? editDraft : toDraft(account);

              return (
                <TableRow key={account.id}>
                  <TableCell className="min-w-32">
                    {isEditing ? (
                      <Input
                        name="platform"
                        value={currentDraft.platform}
                        onChange={(event) =>
                          setEditDraft((current) => ({ ...current, platform: event.target.value }))
                        }
                        required
                      />
                    ) : (
                      <span className="font-medium">{account.platform}</span>
                    )}
                  </TableCell>
                  <TableCell className="min-w-40">
                    {isEditing ? (
                      <Input
                        name="label"
                        value={currentDraft.label}
                        onChange={(event) => setEditDraft((current) => ({ ...current, label: event.target.value }))}
                        required
                      />
                    ) : (
                      account.label
                    )}
                  </TableCell>
                  <TableCell className="min-w-48">
                    {isEditing ? (
                      <Input
                        name="loginUsername"
                        value={currentDraft.loginUsername}
                        onChange={(event) =>
                          setEditDraft((current) => ({ ...current, loginUsername: event.target.value }))
                        }
                      />
                    ) : (
                      account.loginUsername || <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="min-w-36">
                    {isEditing ? (
                      <Input
                        name="loginPassword"
                        value={currentDraft.loginPassword}
                        onChange={(event) =>
                          setEditDraft((current) => ({ ...current, loginPassword: event.target.value }))
                        }
                      />
                    ) : account.loginPassword ? (
                      <code>{account.loginPassword}</code>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="min-w-52">
                    {isEditing ? (
                      <Input
                        name="loginUrl"
                        value={currentDraft.loginUrl}
                        onChange={(event) => setEditDraft((current) => ({ ...current, loginUrl: event.target.value }))}
                      />
                    ) : account.loginUrl ? (
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
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="min-w-52">
                    {isEditing ? (
                      <Input
                        name="notes"
                        value={currentDraft.notes}
                        onChange={(event) => setEditDraft((current) => ({ ...current, notes: event.target.value }))}
                      />
                    ) : (
                      account.notes || <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="min-w-24">
                    {isEditing ? (
                      <Input
                        name="sortOrder"
                        type="number"
                        value={currentDraft.sortOrder}
                        onChange={(event) =>
                          setEditDraft((current) => ({ ...current, sortOrder: event.target.value }))
                        }
                      />
                    ) : (
                      account.sortOrder
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDateTime(account.updatedAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {isEditing ? (
                        <>
                          <NativeForm
                            action={adminApiActions.saveInternalAccount}
                            method="POST"
                            onSubmit={handleUpdate}
                          >
                            <input type="hidden" name="id" value={account.id} />
                            <input type="hidden" name="platform" value={currentDraft.platform} />
                            <input type="hidden" name="label" value={currentDraft.label} />
                            <input type="hidden" name="loginUsername" value={currentDraft.loginUsername} />
                            <input type="hidden" name="loginPassword" value={currentDraft.loginPassword} />
                            <input type="hidden" name="loginUrl" value={currentDraft.loginUrl} />
                            <input type="hidden" name="notes" value={currentDraft.notes} />
                            <input type="hidden" name="sortOrder" value={currentDraft.sortOrder} />
                            <Button type="submit" variant="outline" size="sm">
                              <Save className="h-4 w-4" />
                              Lưu
                            </Button>
                          </NativeForm>
                          <Button type="button" variant="outline" size="sm" onClick={cancelEditing}>
                            <X className="h-4 w-4" />
                            Hủy
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button type="button" variant="outline" size="sm" onClick={() => startEditing(account)}>
                            <Pencil className="h-4 w-4" />
                            Sửa
                          </Button>
                          <NativeForm
                            action={adminApiActions.removeInternalAccount}
                            method="POST"
                            onSubmit={(event) => handleDelete(event, account.label)}
                          >
                            <input type="hidden" name="id" value={account.id} />
                            <Button type="submit" variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4" />
                              Xóa
                            </Button>
                          </NativeForm>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
