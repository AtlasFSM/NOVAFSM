'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, setAuth } = useAuthStore();

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  // Mock login for development
  const handleMockLogin = () => {
    const mockUser = {
      id: 'user-123',
      email: 'demo@novafsm.com',
      firstName: 'Demo',
      lastName: 'User',
      role: 'Admin',
      organizationId: 'org-123',
      organizationName: 'Demo Organization',
    };

    const mockToken = 'mock-jwt-token-123';

    setAuth(mockUser, mockToken);
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-2xl font-bold">N</span>
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Welcome to NoVaFSM</CardTitle>
          <CardDescription className="text-center">
            Field Service Management Platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground text-center">
                Login page is under development. Click below to access the dashboard with a demo account.
              </p>
            </div>
            <Button onClick={handleMockLogin} className="w-full" size="lg">
              Continue as Demo User
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
