import { listAccounts, requireAdmin } from"@/lib/auth";
import { UserManagement } from"@/features/admin/components/users/user-management";

export default async function AdminUserPage() {
 const actor = await requireAdmin();
 const users = await listAccounts();

 return (
 <UserManagement 
  initialUsers={users} 
  actor={actor} 
 />
 );
}
