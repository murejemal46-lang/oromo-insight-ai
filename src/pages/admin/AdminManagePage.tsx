import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminManagementPanel } from '@/components/admin/AdminManagementPanel';

export default function AdminManagePage() {
  return (
    <AdminLayout>
      <AdminManagementPanel />
    </AdminLayout>
  );
}
