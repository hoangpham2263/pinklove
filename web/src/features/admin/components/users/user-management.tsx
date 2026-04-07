"use client";

import * as React from"react";
import { NativeForm } from"@/components/common/native-form";
import { Badge } from"@/components/ui/badge";
import { Button } from"@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Input } from"@/components/ui/input";
import Link from"next/link";
import { AccountUser, AuthUser } from"@/lib/auth";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";

interface UserManagementProps {
 initialUsers: AccountUser[];
 actor: AuthUser;
}

export function UserManagement({ initialUsers, actor }: UserManagementProps) {
  const columns: ColumnDef<AccountUser>[] = [
    {
      accessorKey: "username",
      header: "Tên đăng nhập",
      cell: ({ row }) => (
        <div className="flex items-center">
          {row.original.username}
          {row.original.id === actor.id && (
            <span className="ml-2 text-muted-foreground italic text-xs">
              (bạn)
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Vai trò",
      cell: ({ row }) => (
        <Badge variant={row.original.role === "admin" ? "default" : "secondary"}>
          {row.original.role}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Hành động</div>,
      cell: ({ row }) => {
        const user = row.original;
        const isSelf = user.id === actor.id;
        
        return (
          <div className="flex items-center justify-end gap-2">
            <Link 
              href={`/admin/user/${user.id}`}
              title="Sửa thông tin"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-accent"
            >
              <Pencil className="h-4 w-4" />
            </Link>

            <NativeForm action="/api/admin/users/delete" method="POST" className="inline-block">
              <input type="hidden" name="userId" value={String(user.id)} />
              <Button
                type="submit"
                variant="destructive"
                size="icon"
                className="h-8 w-8 border border-destructive/50"
                disabled={isSelf}
                title={isSelf ? "Không thể tự xóa bản thân" : "Xóa tài khoản"}
                onClick={(e) => {
                  if (!confirm(`Bạn có chắc chắn muốn xóa người dùng: ${user.username}?`)) {
                    e.preventDefault();
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </NativeForm>
          </div>
        );
      },
    },
  ];

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <Card>
        <CardHeader>
          <CardTitle>Tạo tài khoản mới</CardTitle>
        </CardHeader>
        <CardContent>
          <NativeForm
            action="/api/admin/users/create"
            method="POST"
            className="grid gap-4 md:grid-cols-3"
          >
            <div className="space-y-2">
              <label>Tên đăng nhập</label>
              <Input name="username" placeholder="" required />
            </div>
            <div className="space-y-2">
              <label>Mật khẩu</label>
              <Input
                name="password"
                type="password"
                placeholder=""
                required
              />
            </div>
            <div className="space-y-2">
              <label>Vai trò</label>
              <select
                name="role"
                defaultValue="user"
                className="h-10 w-full"
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </div>

            <div className="md:col-span-3 grid gap-4 md:grid-cols-3 border-t pt-4">
              <div className="space-y-2">
                <label>Họ và tên</label>
                <Input name="fullName" placeholder="" />
              </div>
              <div className="space-y-2">
                <label>Tên hiển thị</label>
                <Input name="displayName" placeholder="" />
              </div>
              <div className="space-y-2">
                <label>Số điện thoại</label>
                <Input name="phone" placeholder="" />
              </div>
            </div>

            <div className="md:col-span-3">
              <Button type="submit" className="w-full md:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Tạo tài khoản
              </Button>
            </div>
          </NativeForm>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách Người dùng</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={initialUsers} />
        </CardContent>
      </Card>
    </section>
  );
}
