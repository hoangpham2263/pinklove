import { redirect } from"next/navigation";
import { ROUTES } from "@/lib/routes";

export default function UserIndexPage() { redirect(ROUTES.USER.DASHBOARD); }
