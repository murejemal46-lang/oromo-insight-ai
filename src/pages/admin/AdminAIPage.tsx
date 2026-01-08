import { AdminLayout } from '@/components/admin/AdminLayout';
import { AISettingsPanel } from '@/components/admin/AISettingsPanel';

export default function AdminAIPage() {
  return (
    <AdminLayout>
      <AISettingsPanel />
    </AdminLayout>
  );
}
