'use client';
import AuthShell from '@/components/layout/AuthShell';
import RecoverForm from '@/components/auth/RecoverForm';

export default function AdminRecoverPage() {
  return (
    <AuthShell variant="admin" subtitle="Recuperar acceso" backHref="/login" backLabel="Volver al login">
      <RecoverForm variant="admin" />
    </AuthShell>
  );
}
