"use client";

import { Trash2 } from "lucide-react";
import { NativeForm } from "@/components/common/native-form";
import { Button } from "@/components/ui/button";

export function DeletePageButton({ 
  slug, 
  name, 
  showIconOnly = false 
}: { 
  slug: string; 
  name: string;
  showIconOnly?: boolean;
}) {
  return (
    <NativeForm action="/api/admin/pages/delete" method="POST" className="inline-block">
      <input type="hidden" name="slug" value={slug} />
      <Button
        type="submit"
        variant="destructive"
        size={showIconOnly ? "icon" : "sm"}
        className={`h-8 ${showIconOnly ? "w-8" : ""} border border-destructive/50`}
        title="Xóa trang"
        onClick={(e) => {
          if (!confirm(`Bạn có chắc chắn muốn xóa trang: ${name}?`)) {
            e.preventDefault();
          }
        }}
      >
        {showIconOnly ? <Trash2 className="h-4 w-4" /> : "Xóa"}
      </Button>
    </NativeForm>
  );
}
