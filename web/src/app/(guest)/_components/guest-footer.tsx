import Link from "next/link";
import type { GuestHeaderNode } from "@/app/(guest)/_components/guest-header";
import { getRoleLabel, isAdminRole, type UserRole } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";

type GuestFooterProps = {
  user: {
    role: UserRole;
  } | null;
  footerTree: GuestHeaderNode[];
  dashboardHref: string;
  settingsHref: string;
};

function flattenNavTree(nodes: GuestHeaderNode[]): GuestHeaderNode[] {
  return nodes.flatMap((node) => [node, ...flattenNavTree(node.children)]);
}

export function GuestFooter({
  user,
  footerTree,
  dashboardHref,
  settingsHref,
}: GuestFooterProps) {
  return (
    <footer className="mt-auto border-t border-stone-200 bg-[linear-gradient(180deg,#fffaf7_0%,#f4ede7_100%)]">
      <div className="container mx-auto grid gap-10 px-4 py-12 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-400">pinklove guest</p>
          <h2 className="text-xl font-semibold text-stone-950 sm:text-2xl lg:text-3xl 2 xl:text-4xl">
            Thiệp cưới online gọn, rõ và dễ tùy chỉnh.
          </h2>
          <p className="text-sm leading-7 text-stone-600 md:text-base lg:text-lg">
            PinkLove giúp bạn bắt đầu nhanh với mẫu có sẵn hoặc tự dựng thiệp theo ý muốn, rồi tiếp tục chỉnh nội dung trong tài khoản của mình.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Điều hướng</p>
          <div className="flex flex-col gap-2">
            {flattenNavTree(footerTree).map((item) => (
              <Link key={item.id} href={item.href} className="text-sm text-stone-600 transition hover:text-stone-950 md:text-base">
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Tài khoản</p>
          <div className="flex flex-col gap-2">
            {user ? (
              <>
                <Link href={dashboardHref} className="text-sm text-stone-600 transition hover:text-stone-950 md:text-base">
                  {isAdminRole(user.role) ? "Bảng điều khiển admin" : "Khu vực khách hàng"}
                </Link>
                <p className="text-sm text-stone-500 md:text-base">Vai trò: {getRoleLabel(user.role)}</p>
                <Link href={ROUTES.CUSTOMER.INVITATIONS} className="text-sm text-stone-600 transition hover:text-stone-950 md:text-base">
                  Thiệp của tôi
                </Link>
                <Link href={ROUTES.CHECKOUT.CART} className="text-sm text-stone-600 transition hover:text-stone-950 md:text-base">
                  Giỏ hàng
                </Link>
                <Link href={ROUTES.CUSTOMER.ORDERS} className="text-sm text-stone-600 transition hover:text-stone-950 md:text-base">
                  Đơn hàng của tôi
                </Link>
                <Link href={settingsHref} className="text-sm text-stone-600 transition hover:text-stone-950 md:text-base">
                  Cài đặt tài khoản
                </Link>
              </>
            ) : (
              <>
                <Link href={ROUTES.AUTH.LOGIN} className="text-sm text-stone-600 transition hover:text-stone-950 md:text-base">
                  Đăng nhập
                </Link>
                <Link href={ROUTES.AUTH.REGISTER} className="text-sm text-stone-600 transition hover:text-stone-950 md:text-base">
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-stone-200">
        <div className="container mx-auto flex flex-col gap-2 px-4 py-4 text-sm text-stone-500 md:flex-row md:items-center md:justify-between">
          <p>© 2026 PinkLove. All rights reserved.</p>
          <p>Khu guest dùng UI riêng. Khu admin và customer dùng shadcn/ui.</p>
        </div>
      </div>
    </footer>
  );
}
