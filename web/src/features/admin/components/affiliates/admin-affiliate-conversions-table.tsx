"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { NativeForm } from "@/components/common/native-form";
import { AdminTableActionButton } from "@/features/admin/components/admin-table-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type AffiliateConversion, type AffiliateConversionStatus } from "@/features/affiliate/types";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";

type AdminAffiliateConversionsTableProps = {
  conversions: AffiliateConversion[];
};

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 16).replace("T", " ");
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function AdminAffiliateConversionsTable({ conversions }: AdminAffiliateConversionsTableProps) {
  const router = useRouter();
  const [draftStatuses, setDraftStatuses] = useState<Record<string, AffiliateConversionStatus>>({});

  function getDraftStatus(conversion: AffiliateConversion) {
    return draftStatuses[conversion.id] ?? conversion.status;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Affiliate Conversions</h2>
        <p className="text-sm text-muted-foreground">
          Conversion mới sẽ ở trạng thái pending. Admin duyệt approved, đánh dấu paid sau khi đã thanh toán hoa hồng, hoặc rejected khi hoàn/hủy.
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Affiliate</TableHead>
              <TableHead>Đơn hàng</TableHead>
              <TableHead>Giá trị đơn</TableHead>
              <TableHead>Hoa hồng</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conversions.length > 0 ? (
              conversions.map((conversion) => {
                const draftStatus = getDraftStatus(conversion);

                return (
                  <TableRow key={conversion.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{conversion.username ?? conversion.affiliateUserId}</p>
                        <code className="text-xs text-muted-foreground">{conversion.affiliateCode}</code>
                      </div>
                    </TableCell>
                    <TableCell>{conversion.externalOrderRef ?? "-"}</TableCell>
                    <TableCell>{formatAmount(conversion.orderValue)}</TableCell>
                    <TableCell>{formatAmount(conversion.commissionAmount)}</TableCell>
                    <TableCell>
                      <select
                        value={draftStatus}
                        onChange={(event) =>
                          setDraftStatuses((current) => ({
                            ...current,
                            [conversion.id]: event.target.value as AffiliateConversionStatus,
                          }))
                        }
                        className="h-8 rounded-md border bg-background px-2 text-sm"
                      >
                        <option value="pending">pending</option>
                        <option value="approved">approved</option>
                        <option value="rejected">rejected</option>
                        <option value="paid">paid</option>
                      </select>
                    </TableCell>
                    <TableCell>{formatDateTime(conversion.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <NativeForm
                        action={adminApiActions.updateAffiliateConversion}
                        method="POST"
                        onSubmit={async (event) => {
                          event.preventDefault();
                          try {
                            const formData = new FormData(event.currentTarget);
                            const result = await adminApi.updateAffiliateConversion(formData);
                            toast.success(result.message ?? "Đã cập nhật conversion.");
                            finishMutation(router, result, { redirect: false });
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : "Không thể cập nhật conversion.");
                          }
                        }}
                      >
                        <input type="hidden" name="conversionId" value={conversion.id} />
                        <input type="hidden" name="status" value={draftStatus} />
                        <AdminTableActionButton action="save" label="Lưu conversion" type="submit" />
                      </NativeForm>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Chưa có conversion affiliate.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
