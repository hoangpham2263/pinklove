import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

export default function AdminPlanningOverviewPage() {
  redirect(`${ROUTES.ADMIN.BOOKING}#planning`);
}
