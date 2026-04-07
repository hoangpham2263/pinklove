"use client";

import Link from "next/link";
import { Eye, Pencil } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import type { CmsPage } from "@/lib/cms";

type AdminPagesTableProps = {
  pages: CmsPage[];
  emptyMessage: string;
};

export function AdminPagesTable({ pages, emptyMessage }: AdminPagesTableProps) {
  const columns: ColumnDef<CmsPage>[] = [
    {
      accessorKey: "name",
      header: "Tiêu đề",
      cell: ({ row }) => {
        const page = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-semibold">{page.name}</span>
            {page.title && <span className="text-muted-foreground text-xs">{page.title}</span>}
          </div>
        );
      },
    },
    {
      accessorKey: "slug",
      header: "Slug (Đường dẫn)",
      cell: ({ row }) => (
        <code className="relative rounded bg-muted px-[5px] py-[3px] font-mono text-sm">
          /{row.original.slug}
        </code>
      ),
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const page = row.original;
        return (
          <Badge variant={page.status === "published" ? "default" : "secondary"}>
            {page.status || "draft"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Hành động</div>,
      cell: ({ row }) => {
        const page = row.original;
        const targetUrl =
          page.slug === "home"
            ? "/"
            : page.slug === "login" || page.slug === "register"
              ? `/user/${page.slug}`
              : `/${page.slug}`;

        return (
          <div className="flex justify-end gap-2">
            <Link
              href={targetUrl}
              target="_blank"
              title="Xem trang"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-accent"
            >
              <Eye className="h-4 w-4" />
            </Link>
            <Link
              href={`/admin/pages/${page.slug}`}
              title="Sửa trang"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Pencil className="h-4 w-4" />
            </Link>
          </div>
        );
      },
    },
  ];

  return <DataTable columns={columns} data={pages} emptyMessage={emptyMessage} />;
}
