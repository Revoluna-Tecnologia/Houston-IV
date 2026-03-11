'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '@/components/auth';
import { useAuth } from '@/hooks';

function ResetSuccessMessage() {
  const searchParams = useSearchParams();
  const t = useTranslations('Auth.login');
  const resetSuccess = searchParams.get('reset') === 'success';

  if (!resetSuccess) {
    return null;
  }

  return (
    <div className="mb-4 p-3 rounded-md bg-green-50 border border-green-200">
      <p className="text-sm text-green-700">
        {t('resetSuccess')}
      </p>
    </div>
  );
}

function LoginContent() {
  const router = useRouter();
  const t = useTranslations('Auth.login');
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSuccess = () => {
    router.replace('/');
  };

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <Card className="w-full max-w-[500px] mx-auto">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-normal text-center mt-[2px]">
          {t('title')}
        </CardTitle>
        <CardDescription className="text-center">
          {t('subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-w-sm mx-auto">
          <Suspense fallback={null}>
            <ResetSuccessMessage />
          </Suspense>
          <LoginForm onSuccess={handleSuccess} />
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return <LoginContent />;
}
