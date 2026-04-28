import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";

import { AddressDetails } from "@/components/common/address-editor-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserAddressById } from "@/features/account/server/address-service";
import { requireVendor } from "@/lib/auth";
import { getSafeReturnTo } from "@/lib/return-to";
import { ROUTES } from "@/lib/routes";

export default async function PartnerAddressDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const vendor = await requireVendor(ROUTES.PARTNER.LOGIN);
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const address = await getUserAddressById(vendor.id, id);

  if (!address) {
    notFound();
  }

  const returnTo = getSafeReturnTo(query.returnTo, ROUTES.PARTNER.CONFIG_ADDRESSES);
  const encodedReturnTo = encodeURIComponent(returnTo);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <CardTitle>Chi tiết địa chỉ vendor</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" render={<Link href={returnTo}>Quay lại</Link>} />
            <Button
              className="gap-2"
              render={
                <Link href={`${ROUTES.PARTNER.CONFIG_ADDRESS_EDIT(address.id)}?returnTo=${encodedReturnTo}`}>
                  <Pencil className="h-4 w-4" />
                  Sửa địa chỉ
                </Link>
              }
            />
          </div>
        </CardHeader>
        <CardContent>
          <AddressDetails address={address} />
        </CardContent>
      </Card>
    </section>
  );
}
