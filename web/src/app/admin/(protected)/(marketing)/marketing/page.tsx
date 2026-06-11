import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

export default function AdminMarketingOverviewPage() {
  redirect(`${ROUTES.ADMIN.CONTENT}#marketing`);
}
