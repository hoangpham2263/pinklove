import { MessagesSquare } from "lucide-react";

import { NativeForm } from "@/components/common/native-form";
import { AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { AdminDatabasePage } from "@/features/admin/components/admin-database-page";
import { listAllProviderReviews } from "@/features/providers/server/workspace";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function AdminProviderReviewsPage() {
  await requireAdmin();
  const rows = await listAllProviderReviews();

  return (
    <>
      <AdminDatabasePage
        title="Provider Reviews"
        description="Quản lý đánh giá provider và trạng thái hiển thị."
        rows={rows}
        icon={MessagesSquare}
        metricLabel="Reviews"
        columns={[
          { key: "provider", label: "Provider" },
          { key: "customer", label: "Customer" },
          { key: "rating", label: "Rating" },
          { key: "status", label: "Status" },
          { key: "content", label: "Content" },
          { key: "created_at", label: "Created" },
        ]}
      />
      <section className="mx-5 mb-7.5 rounded-md border bg-background p-5 md:mx-7.5">
        <h2 className="text-base font-semibold">Moderation</h2>
        <div className="mt-4 grid gap-3">
          {rows.map((row) => (
            <NativeForm key={String(row.id)} action={ROUTES.API.ADMIN.PROVIDER_REVIEWS.STATUS} method="POST" className="grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_11rem_auto]">
              <input type="hidden" name="reviewId" value={String(row.id)} />
              <div className="text-sm">
                <p className="font-medium">{String(row.provider)} · {String(row.rating)} sao</p>
                <p className="line-clamp-1 text-muted-foreground">{String(row.content || "Không có nội dung")}</p>
              </div>
              <select name="status" defaultValue={String(row.status)} className="h-9 rounded-md border bg-background px-3 text-sm">
                {["pending", "published", "rejected"].map((status) => <option key={status}>{status}</option>)}
              </select>
              <AdminSubmitButton>Lưu</AdminSubmitButton>
            </NativeForm>
          ))}
        </div>
      </section>
    </>
  );
}
