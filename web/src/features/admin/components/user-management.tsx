"use client";

import * as React from"react";
import { NativeForm } from"@/components/common/native-form";
import { Badge } from"@/components/ui/badge";
import { Button } from"@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from"@/components/ui/table";
import { Input } from"@/components/ui/input";
import Link from"next/link";
import { AccountUser, AuthUser } from "@/lib/auth";
import { Plus } from"lucide-react";

interface UserManagementProps {
 initialUsers: AccountUser[];
 actor: AuthUser;
}

export function UserManagement({ initialUsers, actor }: UserManagementProps) {
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
    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 focus:outline-none"
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
   <Table>
   <TableHeader>
    <TableRow>
    <TableHead>Tên đăng nhập</TableHead>
    <TableHead>Vai trò</TableHead>
    <TableHead className="text-right">Hành động</TableHead>
    </TableRow>
   </TableHeader>
   <TableBody>
    {initialUsers.map((user) => (
    <TableRow key={user.id}>
     <TableCell>
     {user.username}
     {user.id === actor.id && (
      <span className="ml-2 text-muted-foreground italic">
      (bạn)
      </span>
     )}
     </TableCell>
     <TableCell>
     {user.role}
     </TableCell>
     <TableCell className="text-right">
     <div className="flex items-center justify-end gap-2">
      <Link href={`/admin/user/${user.id}`}>
      <Button variant="outline">Sửa</Button>
      </Link>

      <NativeForm action="/api/admin/users/delete" method="POST">
      <input type="hidden" name="userId" value={String(user.id)} />
      <Button
       type="submit"
       variant="outline"
       disabled={user.id === actor.id}
      >
       Xóa
      </Button>
      </NativeForm>
     </div>
     </TableCell>
    </TableRow>
    ))}
   </TableBody>
   </Table>
  </CardContent>
  </Card>
 </section>
 );
}
