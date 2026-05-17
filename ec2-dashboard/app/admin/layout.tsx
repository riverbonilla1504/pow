'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hasToken } from '@/lib/api';
import AdminSidebar from '@/components/admin/Sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hasToken()) router.replace('/login');
    else setReady(true);
  }, [router]);

  if (!ready) return null;

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="ml-56 flex-1 p-6 animate-fade-in">{children}</main>
    </div>
  );
}
