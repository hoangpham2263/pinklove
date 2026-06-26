import { CheckCircle2, Clock3, MessageSquare, ShieldAlert } from "lucide-react";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { AdminCommentsTable } from "@/features/comments/admin/admin-comments-table";
import { listAdminComments } from "@/features/comments/server/service";
import { requireAdmin } from "@/lib/auth";

type AdminCommentsPageProps = {
  searchParams: Promise<{ status?: string; q?: string }>;
};

export default async function AdminCommentsPage({ searchParams }: AdminCommentsPageProps) {
  await requireAdmin();
  const params = await searchParams;
  const status = params.status || "pending";
  const keyword = params.q || "";
  const comments = await listAdminComments({ status, keyword });
  const pendingCount = comments.filter((comment) => comment.status === "pending").length;
  const approvedCount = comments.filter((comment) => comment.status === "approved").length;
  const rejectedCount = comments.filter((comment) => comment.status === "rejected" || comment.status === "spam").length;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <AdminOverviewGrid>
        <AdminOverviewCard title="Total" value={comments.length} icon={MessageSquare} />
        <AdminOverviewCard title="Pending" value={pendingCount} icon={Clock3} />
        <AdminOverviewCard title="Approved" value={approvedCount} icon={CheckCircle2} />
        <AdminOverviewCard title="Rejected / Spam" value={rejectedCount} icon={ShieldAlert} />
      </AdminOverviewGrid>

      <AdminCommentsTable comments={comments} status={status} keyword={keyword} />
    </section>
  );
}
