import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

export default function AdminBookingOverviewPage() {
  redirect(`${ROUTES.ADMIN.COMMERCE}#booking`);
}
