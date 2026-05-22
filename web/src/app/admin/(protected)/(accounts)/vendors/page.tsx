import { CheckCircle2, ClipboardList, PackageSearch, Store } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminCreateLinkButton, AdminLinkButton } from "@/features/admin/components/admin-buttons";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { AdminVendorList, type AdminVendorRow } from "@/features/admin/components/vendors/admin-vendor-list";
import { listVendorOfferingSubmissionsForAdmin } from "@/features/vendor-offering-submissions/server/service";
import { countVendorAssignmentsForVendor } from "@/features/vendor-orders/server/service";
import { ensureVendorPortalSlug, listAccounts, listAccountsByRole, requireAdmin } from "@/lib/auth";
import { USER_ROLES } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";

type AdminVendorsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminVendorsPage({ searchParams }: AdminVendorsPageProps) {
  await requireAdmin();
  await searchParams;

  const [vendorAccounts, allUsers, submissions] = await Promise.all([
    listAccountsByRole(USER_ROLES.VENDOR),
    listAccounts(),
    listVendorOfferingSubmissionsForAdmin(),
  ]);

  const vendors: AdminVendorRow[] = await Promise.all(
    vendorAccounts.map(async (vendor) => {
      const [vendorPortalSlug, stats] = await Promise.all([
        vendor.vendorPortalSlug ? Promise.resolve(vendor.vendorPortalSlug) : ensureVendorPortalSlug(vendor.id),
        countVendorAssignmentsForVendor(vendor.id),
      ]);
      const vendorSubmissions = submissions.filter((submission) => submission.vendorUserId === vendor.id);
      const pendingOfferings = vendorSubmissions.filter((submission) =>
        ["submitted", "under_review", "changes_requested"].includes(submission.reviewStatus)
      ).length;

      return {
        ...vendor,
        vendorPortalSlug: vendorPortalSlug || "",
        assignmentTotal: stats.total,
        assignmentActive: stats.active,
        assignmentReview: stats.review,
        assignmentCompleted: stats.completed,
        submittedOfferings: vendorSubmissions.length,
        pendingOfferings,
      };
    })
  );

  const activeCount = vendors.filter((vendor) => vendor.accountStatus === "active").length;
  const riskCount = vendors.filter((vendor) => vendor.accountStatus !== "active").length;
  const totalAssignments = vendors.reduce((sum, vendor) => sum + vendor.assignmentTotal, 0);
  const totalPendingOfferings = vendors.reduce((sum, vendor) => sum + vendor.pendingOfferings, 0);
  const roleShare = allUsers.length === 0 ? 0 : Math.round((vendors.length / allUsers.length) * 100);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý nhà cung cấp</h1>
          <p className="text-sm text-muted-foreground">
            Theo dõi vendor, portal đăng nhập, hồ sơ sản phẩm và các đơn đã phân công trong một màn hình.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminLinkButton href={ROUTES.ADMIN.VENDOR_OFFERINGS}>Review sản phẩm vendor</AdminLinkButton>
          <AdminCreateLinkButton href={ROUTES.ADMIN.VENDORS_CREATE}>Tạo nhà cung cấp</AdminCreateLinkButton>
        </div>
      </div>

      <AdminOverviewGrid>
        <AdminOverviewCard title="Tổng vendor" value={vendors.length} description={`${roleShare}% tổng tài khoản`} icon={Store} />
        <AdminOverviewCard title="Đang hoạt động" value={activeCount} description={`${riskCount} tài khoản đang bị hạn chế`} icon={CheckCircle2} />
        <AdminOverviewCard title="Đơn đã phân công" value={totalAssignments} description="Tổng đơn vendor đang quản lý" icon={ClipboardList} />
        <AdminOverviewCard title="Hồ sơ cần review" value={totalPendingOfferings} description="Submitted / under review / cần bổ sung" icon={PackageSearch} />
      </AdminOverviewGrid>

      <Card className="rounded-lg">
        <CardHeader className="border-b">
          <CardTitle>Danh sách vendor</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <AdminVendorList vendors={vendors} />
        </CardContent>
      </Card>
    </section>
  );
}
