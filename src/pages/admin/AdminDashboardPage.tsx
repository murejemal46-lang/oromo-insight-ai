import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminOverview } from '@/components/admin/AdminOverview';

export default function AdminDashboardPage() {
  return (
    <AdminLayout>
      <AdminOverview />
    </AdminLayout>
  );
}
