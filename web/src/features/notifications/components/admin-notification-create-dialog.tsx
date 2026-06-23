import type { UserRole } from "@/lib/roles";
import { AdminNotificationUpsertDialog } from "@/features/notifications/components/admin-notification-upsert-dialog";

type AccountOption = {
  id: string;
  accountName: string;
  role: UserRole;
};

type RoleOption = {
  value: UserRole;
  label: string;
};

type AdminNotificationCreateDialogProps = {
  accounts: AccountOption[];
  roles: RoleOption[];
};

export function AdminNotificationCreateDialog({ accounts, roles }: AdminNotificationCreateDialogProps) {
  return <AdminNotificationUpsertDialog accounts={accounts} roles={roles} />;
}
