import type { ReactNode } from 'react';
import { HoustonLogo } from '@/components/ui/houston-logo';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center p-4">
      <div className="w-full flex flex-col items-center justify-center">
        <div className="flex items-center justify-center mb-10">
          <HoustonLogo className="h-8 text-primary" />
        </div>
        <div className="w-full max-w-[500px]">
          {children}
        </div>
      </div>
    </div>
  );
}
