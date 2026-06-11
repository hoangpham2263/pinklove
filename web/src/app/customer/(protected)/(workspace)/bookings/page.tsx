import { CalendarClock } from "lucide-react";

import { NativeForm } from "@/components/common/native-form";
import { DatabasePage } from "@/components/common/database-table";
import { Button } from "@/components/ui/button";
import { listBookingsForCustomer, listReviewableBookingProvidersForCustomer } from "@/features/bookings/server/service";
import { requireAppUser } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function CustomerBookingsPage() {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const [rows, reviewTargets] = await Promise.all([
    listBookingsForCustomer(user.id),
    listReviewableBookingProvidersForCustomer(user.id),
  ]);

  return (
    <>
      <DatabasePage
        title="Bookings"
        description="Theo dõi các yêu cầu đặt dịch vụ tách biệt khỏi đơn hàng vật lý."
        rows={rows}
        icon={CalendarClock}
        metricLabel="Bookings"
        columns={[
          { key: "booking_number", label: "Booking" },
          { key: "providers", label: "Providers" },
          { key: "status", label: "Status" },
          { key: "latest_payment_status", label: "Payment" },
          { key: "scheduled_at", label: "Scheduled" },
          { key: "total_amount", label: "Total" },
          { key: "latest_status_note", label: "Latest update" },
        ]}
      />
      <section className="mx-5 mb-7.5 rounded-md border bg-background p-5 md:mx-7.5">
        <h2 className="text-base font-semibold">Đánh giá provider sau booking</h2>
        {reviewTargets.length > 0 ? (
          <NativeForm action={ROUTES.API.CUSTOMER.PROVIDER_REVIEWS} method="POST" className="mt-4 grid gap-3 md:grid-cols-[1fr_8rem_1fr_auto]">
            <select name="providerId" className="h-9 rounded-md border bg-background px-3 text-sm">
              {reviewTargets.map((target) => (
                <option key={String(target.id)} value={String(target.id)}>
                  {String(target.display_name)} · {String(target.booking_number)}
                </option>
              ))}
            </select>
            <select name="rating" defaultValue="5" className="h-9 rounded-md border bg-background px-3 text-sm">
              {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} sao</option>)}
            </select>
            <input name="content" placeholder="Nhận xét của bạn" className="h-9 rounded-md border bg-background px-3 text-sm" />
            <Button type="submit" size="lg">Gửi</Button>
          </NativeForm>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Bạn sẽ có thể đánh giá provider sau khi booking được xác nhận hoặc hoàn tất.</p>
        )}
      </section>
    </>
  );
}
