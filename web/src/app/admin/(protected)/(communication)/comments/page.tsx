import { CheckCircle2, Clock3, MessageSquare, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{comments.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{pendingCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{approvedCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Rejected / Spam</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{rejectedCount}</p>
          </CardContent>
        </Card>
      </div>

      <AdminCommentsTable comments={comments} status={status} keyword={keyword} />
    </section>
  );
}
