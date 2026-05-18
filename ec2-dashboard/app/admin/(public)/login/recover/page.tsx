'use client';
import AuthShell from '@/components/layout/AuthShell';
import RecoverForm from '@/components/auth/RecoverForm';

export default function AdminRecoverPage() {
  return (
    <AuthShell
      variant="admin"
      heading="Recupera el acceso al panel"
      subtitle="Recuperar acceso"
      backHref="/admin/login"
      backLabel="Volver al login"
    >
      <RecoverForm variant="admin" />
    </AuthShell>
  );
}
