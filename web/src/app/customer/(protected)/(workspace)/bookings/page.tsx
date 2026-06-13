import { NativeForm } from "@/components/common/native-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerBookingsTable } from "@/features/customer/components/customer-bookings-table";
import { CustomerSubmitButton } from "@/features/customer/ui/customer-buttons";
import { CustomerInput, CustomerSelect } from "@/features/customer/ui/customer-form";
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
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div>
        <h1 className="text-2xl font-semibold">Bookings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Theo dõi các yêu cầu đặt dịch vụ, slot lịch đã giữ và cập nhật trạng thái từ provider.
        </p>
      </div>

      {rows.length > 0 ? (
        <CustomerBookingsTable bookings={rows} />
      ) : (
        <Card className="rounded-lg border-dashed">
          <CardHeader>
            <CardTitle>Chưa có booking nào</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Các booking từ quote, provider hoặc dịch vụ có lịch hẹn sẽ xuất hiện tại đây.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Đánh giá provider sau booking</CardTitle>
        </CardHeader>
        <CardContent>
        {reviewTargets.length > 0 ? (
          <NativeForm action={ROUTES.API.CUSTOMER.PROVIDER_REVIEWS} method="POST" className="mt-4 grid gap-3 md:grid-cols-[1fr_8rem_1fr_auto]">
            <CustomerSelect name="providerId">
              {reviewTargets.map((target) => (
                <option key={String(target.id)} value={String(target.id)}>
                  {String(target.display_name)} · {String(target.booking_number)}
                </option>
              ))}
            </CustomerSelect>
            <CustomerSelect name="rating" defaultValue="5">
              {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} sao</option>)}
            </CustomerSelect>
            <CustomerInput name="content" placeholder="Nhận xét của bạn" />
            <CustomerSubmitButton type="submit">Gửi</CustomerSubmitButton>
          </NativeForm>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Bạn sẽ có thể đánh giá provider sau khi booking được xác nhận hoặc hoàn tất.</p>
        )}
        </CardContent>
      </Card>
    </section>
  );
}
