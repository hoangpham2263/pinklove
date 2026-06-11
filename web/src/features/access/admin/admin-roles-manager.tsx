"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, ShieldCheck, ShieldPlus } from "lucide-react";
import { toast } from "sonner";

import { useConfirm } from "@/components/common/confirm-provider";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminCreateLinkButton } from "@/features/admin/components/admin-buttons";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { AdminTableActionButton, AdminTableActions } from "@/features/admin/components/admin-table-actions";
import type { AdminPermission, AdminRole } from "@/features/access/server/service";
import { adminApi } from "@/lib/api-client.admin";
import { ROUTES } from "@/lib/routes";

export function AdminRolesManager({ roles, permissions }: { roles: AdminRole[]; permissions: AdminPermission[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("label-asc");
  const editableRoles = roles.filter((role) => !role.isSystem);
  const filteredRoles = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return roles
      .filter((role) => {
        const matchesSearch = !normalizedSearch
          || role.label.toLowerCase().includes(normalizedSearch)
          || role.key.toLowerCase().includes(normalizedSearch)
          || role.description.toLowerCase().includes(normalizedSearch);
        const matchesStatus = status === "all"
          || (status === "active" ? role.isActive : !role.isActive);
        return matchesSearch && matchesStatus;
      })
      .sort((left, right) => {
        if (sort === "label-desc") return right.label.localeCompare(left.label, "vi");
        if (sort === "permissions-desc") return right.permissionIds.length - left.permissionIds.length;
        if (sort === "permissions-asc") return left.permissionIds.length - right.permissionIds.length;
        return left.label.localeCompare(right.label, "vi");
      });
  }, [roles, search, sort, status]);

  async function remove(role: AdminRole) {
    const approved = await confirm({
      title: "Xóa Admin role",
      description: `Role "${role.label}" sẽ bị xóa vĩnh viễn.`,
      confirmText: "Xóa role",
      variant: "destructive",
    });
    if (!approved) return;
    const form = new FormData();
    form.set("id", role.id);
    try {
      const result = await adminApi.deleteAdminRole(form);
      toast.success(result.message ?? "Đã xóa role.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa role.");
    }
  }

  return <>
    <AdminOverviewGrid>
      <AdminOverviewCard title="Admin roles" value={roles.length} icon={ShieldCheck} />
      <AdminOverviewCard title="Role tùy chỉnh" value={editableRoles.length} icon={ShieldPlus} />
      <AdminOverviewCard title="Permissions" value={permissions.length} icon={KeyRound} />
      <AdminOverviewCard title="Tạo role" icon={ShieldPlus}>
        <AdminCreateLinkButton href={ROUTES.ADMIN.ACCESS_ROLE_NEW}>Thêm role</AdminCreateLinkButton>
      </AdminOverviewCard>
    </AdminOverviewGrid>

    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_200px_220px]">
      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Tìm theo tên, key hoặc mô tả"
      />
      <select
        value={status}
        onChange={(event) => setStatus(event.target.value)}
        className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
      >
        <option value="all">Tất cả trạng thái</option>
        <option value="active">Hoạt động</option>
        <option value="inactive">Tạm ngưng</option>
      </select>
      <select
        value={sort}
        onChange={(event) => setSort(event.target.value)}
        className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
      >
        <option value="label-asc">Tên A-Z</option>
        <option value="label-desc">Tên Z-A</option>
        <option value="permissions-desc">Nhiều quyền nhất</option>
        <option value="permissions-asc">Ít quyền nhất</option>
      </select>
    </div>

    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vai trò</TableHead>
            <TableHead>Key</TableHead>
            <TableHead>Quyền</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRoles.map((role) => (
            <TableRow key={role.id}>
              <TableCell className="font-medium">{role.label}</TableCell>
              <TableCell><code>{role.key}</code></TableCell>
              <TableCell>{role.isSystem ? "Toàn quyền" : role.permissionIds.length}</TableCell>
              <TableCell><Badge variant={role.isActive ? "default" : "secondary"}>{role.isActive ? "Hoạt động" : "Tạm ngưng"}</Badge></TableCell>
              <TableCell>
                {!role.isSystem ? (
                  <AdminTableActions>
                    <AdminTableActionButton action="edit" label={`Sửa ${role.label}`} href={ROUTES.ADMIN.ACCESS_ROLE(role.id)} />
                    <AdminTableActionButton action="delete" label={`Xóa ${role.label}`} onClick={() => remove(role)} />
                  </AdminTableActions>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
          {filteredRoles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                Không tìm thấy vai trò phù hợp.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  </>;
}
