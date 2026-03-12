"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { Toaster } from "sonner";
import { AuthProvider, useAuthContext } from "@/lib/auth-context";
import { Sidebar, Header, MobileNav } from "@/components/layout";
import { LoadingSpinner } from "@/components/houston";

interface DashboardContentProps {
  children: React.ReactNode;
}

function DashboardContent({ children }: DashboardContentProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthContext();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-app-bg">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:ring-2 focus:ring-ring"
      >
        Pular para o conteúdo
      </a>
      <Sidebar user={user} />
      <MobileNav
        user={user}
        open={mobileNavOpen}
        onOpenChange={setMobileNavOpen}
      />
      <div className="lg:pl-64">
        <Header user={user} onMenuClick={() => setMobileNavOpen(true)} />
        <main id="main-content" className="p-4 lg:p-6">
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
      <Toaster richColors position="bottom-right" />
    </AuthProvider>
  );
}
