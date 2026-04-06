"use client";

import { NativeForm } from "@/components/common/native-form";
import { Button } from "@/components/ui/button";

export function DeletePageButton({ slug, name }: { slug: string; name: string }) {
  return (
    <NativeForm action="/api/admin/pages/delete" method="POST" className="inline-block">
      <input type="hidden" name="slug" value={slug} />
      <Button
        type="submit"
        variant="destructive"
        size="sm"
        className="h-8 border border-destructive/50"
        onClick={(e) => {
          if (!confirm(`Are you sure you want to delete page: ${name}?`)) {
            e.preventDefault();
          }
        }}
      >
        Delete
      </Button>
    </NativeForm>
  );
}