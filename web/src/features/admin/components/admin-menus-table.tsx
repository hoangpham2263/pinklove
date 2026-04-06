"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/ui/data-table";
import type { Menu } from "@/lib/menu";

type MenuRow = Omit<Menu, "items">;

type AdminMenusTableProps = {
  menus: MenuRow[];
};

export function AdminMenusTable({ menus }: AdminMenusTableProps) {
  const columns: ColumnDef<MenuRow>[] = [
    {
      accessorKey: "label",
      header: "Tên Menu",
      cell: ({ row }) => <span className="font-medium">{row.original.label}</span>,
    },
    {
      accessorKey: "name",
      header: "Mã định danh (Slug)",
      cell: ({ row }) => (
        <code className="relative rounded bg-muted px-[5px] py-[3px] font-mono text-sm">
          {row.original.name}
        </code>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Hành động</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <Link
            href={`/admin/menus/${row.original.id}`}
            title="Sửa Menu"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-accent"
          >
            <Pencil className="h-4 w-4" />
          </Link>
        </div>
      ),
    },
  ];

  return <DataTable columns={columns} data={menus} />;
}
