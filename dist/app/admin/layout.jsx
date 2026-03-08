import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import AdminShell from './_components/admin-shell';
export default async function AdminLayout({ children, }) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
        redirect('/login');
    }
    return <AdminShell>{children}</AdminShell>;
}
