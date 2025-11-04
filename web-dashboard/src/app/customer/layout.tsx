import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getAuthToken } from '@/lib/auth';
import CustomerNav from '@/components/customer-nav';

export default async function CustomerLayout({ children }: { children: ReactNode }) {
  const token = await getAuthToken();

  if (!token) {
    redirect('/login');
  }

  // In a real app, you'd decode the JWT and check the role
  // For now, we assume the user is a CUSTOMER if they can access this route

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNav />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
