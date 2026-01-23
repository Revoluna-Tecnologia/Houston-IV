'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuthContext } from '../../lib/auth-context';
import { Sidebar, Header, MobileNav } from '../../components/layout';
import { LoadingSpinner } from '@/components/houston';

// #region agent log
const debugLog = (location: string, message: string, data: object, hypothesisId: string) => {
  fetch('http://127.0.0.1:7242/ingest/41fda97e-756c-42b1-9a82-abbcc64dfe44',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location,message,data,timestamp:Date.now(),sessionId:'debug-session',hypothesisId})}).catch(()=>{});
};
// #endregion

interface DashboardContentProps {
  children: React.ReactNode;
}

function DashboardContent({ children }: DashboardContentProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthContext();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // #region agent log
  debugLog('layout.tsx:DashboardContent:render', 'Dashboard render state', { isLoading, isAuthenticated, hasUser: !!user }, 'H4');
  // #endregion

  useEffect(() => {
    // #region agent log
    debugLog('layout.tsx:DashboardContent:useEffect', 'Auth effect triggered', { isLoading, isAuthenticated }, 'H4');
    // #endregion
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    // #region agent log
    debugLog('layout.tsx:DashboardContent:showingSpinner', 'Showing loading spinner', { isLoading }, 'H4');
    // #endregion
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // #region agent log
    debugLog('layout.tsx:DashboardContent:notAuthenticated', 'Not authenticated, returning null', { isAuthenticated }, 'H4');
    // #endregion
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar user={user} />
      <MobileNav
        user={user}
        open={mobileNavOpen}
        onOpenChange={setMobileNavOpen}
      />
      <div className="lg:pl-64">
        <Header
          user={user}
          onMenuClick={() => setMobileNavOpen(true)}
        />
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AuthProvider>
      <DashboardContent>{children}</DashboardContent>
    </AuthProvider>
  );
}
