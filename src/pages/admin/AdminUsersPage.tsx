import { AdminLayout } from '@/components/admin/AdminLayout';
import { UserManagementTable } from '@/components/admin/UserManagementTable';

export default function AdminUsersPage() {
  return (
    <AdminLayout>
      <UserManagementTable />
    </AdminLayout>
  );
}
