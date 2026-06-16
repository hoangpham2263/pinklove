import { headers } from "next/headers";
import { PageToast } from "@/components/common/page-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AffiliateLinkCard } from "@/features/affiliate/components/affiliate-link-card";
import { AffiliateApplyForm } from "@/features/affiliate/components/affiliate-apply-form";
import { CustomerLinkButton } from "@/features/customer/ui/customer-buttons";
import {
  buildAffiliateLink,
  getAffiliateAccountForUser,
  listAffiliateClicksForUser,
  listAffiliateConversionsForUser,
} from "@/features/affiliate/server/service";
import { requireAppUser } from "@/lib/auth";
import { formatVnd } from "@/lib/currency";
import { ROUTES } from "@/lib/routes";
import { getSiteUrlFromHeaderValues } from "@/lib/seo";

type CustomerAffiliatePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getAffiliateErrorMessage(error: string | undefined) {
  if (!error) return null;
  if (error === "AFFILIATE_ALREADY_EXISTS") return "Tài khoản này đã đăng ký affiliate rồi.";
  if (error === "AFFILIATE_CODE_TAKEN") return "Mã affiliate đã được sử dụng.";
  if (error === "AFFILIATE_CODE_INVALID") return "Mã affiliate chưa hợp lệ. Cần tối thiểu 3 ký tự a-z, 0-9 hoặc dấu gạch ngang.";
  return "Không thể xử lý yêu cầu affiliate lúc này.";
}

function getAffiliateStatusLabel(status: string) {
  if (status === "active") return "Active";
  if (status === "rejected") return "Rejected";
  if (status === "blocked") return "Blocked";
  return "Pending";
}

function getConversionStatusLabel(status: string) {
  if (status === "approved") return "Approved";
  if (status === "paid") return "Paid";
  if (status === "rejected") return "Rejected";
  return "Pending";
}

export default async function CustomerAffiliatePage({ searchParams }: CustomerAffiliatePageProps) {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const query = (await searchParams) ?? {};
  const account = await getAffiliateAccountForUser(user.id);
  const clicks = account ? await listAffiliateClicksForUser(user.id, 10) : [];
  const conversions = account ? await listAffiliateConversionsForUser(user.id, 10) : [];

  const headerStore = await headers();
  const origin = getSiteUrlFromHeaderValues({
    host: headerStore.get("host"),
    forwardedHost: headerStore.get("x-forwarded-host"),
    forwardedProto: headerStore.get("x-forwarded-proto"),
  });

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      {query.saved ? (
        <PageToast
          message="Yêu cầu tham gia affiliate đã được gửi. Admin cần duyệt trước khi link của bạn hoạt động."
          variant="success"
        />
      ) : null}
      {query.error ? (
        <PageToast
          message={getAffiliateErrorMessage(String(query.error)) ?? "Không thể xử lý yêu cầu affiliate lúc này."}
          variant="error"
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Chương trình Affiliate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Bạn đăng ký affiliate tại đây. Sau khi gửi, hồ sơ sẽ nằm ở trạng thái chờ duyệt trong admin mục Duyệt Customer Affiliate; khi admin chuyển sang active bạn mới tạo và gửi link được.
          </p>

          {!account ? (
            <AffiliateApplyForm />
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Trạng thái</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant={account.status === "active" ? "default" : "secondary"}>
                      {getAffiliateStatusLabel(account.status)}
                    </Badge>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Lượt click</CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-semibold">{account.clickCount}</CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Conversion đã duyệt</CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-semibold">{account.conversionCount}</CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Hoa hồng đã duyệt</CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-semibold">{account.earnedCommission}</CardContent>
                </Card>
              </div>

              {account.status === "active" ? (
                <>
                  <AffiliateLinkCard
                    code={account.code}
                    link={buildAffiliateLink(account.code, origin)}
                  />
                  <CustomerLinkButton href={ROUTES.CUSTOMER.AFFILIATE_LINKS}>Tạo link affiliate theo trang</CustomerLinkButton>
                </>
              ) : null}

              <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
                {account.status === "active"
                  ? `Tài khoản affiliate đang hoạt động với cơ chế ${account.commissionType === "percent" ? "phần trăm" : "giá trị cố định"}: ${account.commissionValue}.`
                  : "Tài khoản affiliate đang chờ admin duyệt tại mục Duyệt Customer Affiliate. Khi được active, khu vực tạo link sẽ mở."}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lượt truy cập gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            {clicks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có lượt click nào được ghi nhận.</p>
            ) : (
              <div className="space-y-3">
                {clicks.map((click) => (
                  <div key={click.id} className="rounded-md border p-3">
                    <p className="font-medium">{click.landingPath}</p>
                    <p className="text-xs text-muted-foreground">{new Date(click.createdAt).toLocaleString("vi-VN")}</p>
                    {click.referrer && <p className="text-xs text-muted-foreground truncate">Referrer: {click.referrer}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversion đã ghi nhận</CardTitle>
          </CardHeader>
          <CardContent>
            {conversions.length === 0 ? (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Chưa có conversion nào.</p>
                <p>Conversion sẽ xuất hiện khi khách thanh toán đơn hàng qua link affiliate của bạn.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {conversions.map((conversion) => (
                  <div key={conversion.id} className="rounded-md border p-3">
                    <p className="font-medium">Đơn tham chiếu: {conversion.externalOrderRef || "N/A"}</p>
                    <p className="text-sm">Commission: {formatVnd(conversion.commissionAmount)}</p>
                    <p className="text-xs text-muted-foreground">{getConversionStatusLabel(conversion.status)} • {new Date(conversion.createdAt).toLocaleString("vi-VN")}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
