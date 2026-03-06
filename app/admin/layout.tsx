import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import AdminSidebar from './_components/admin-sidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6 lg:p-8 ml-0 lg:ml-64">
          {children}
        </main>
      </div>
    </div>
  );
}
