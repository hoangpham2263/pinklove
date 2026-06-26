import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

export default function CustomerIndexPage() {
  redirect(ROUTES.CUSTOMER.DASHBOARD);
}
