import { AdminLayout } from '@/components/admin/AdminLayout';
import { AuditLogViewer } from '@/components/admin/AuditLogViewer';

export default function AdminLogsPage() {
  return (
    <AdminLayout>
      <AuditLogViewer />
    </AdminLayout>
  );
}
