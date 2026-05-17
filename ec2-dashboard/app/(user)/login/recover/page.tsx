'use client';
import AuthShell from '@/components/layout/AuthShell';
import RecoverForm from '@/components/auth/RecoverForm';

export default function UserRecoverPage() {
  return (
    <AuthShell variant="user" subtitle="Recuperar acceso" backHref="/login" backLabel="Volver al login">
      <RecoverForm variant="user" />
    </AuthShell>
  );
}
