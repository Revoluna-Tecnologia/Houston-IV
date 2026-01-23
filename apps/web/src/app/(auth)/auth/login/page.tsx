'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '../../../../components/auth';
import { useAuth } from '../../../../hooks';

function ResetSuccessMessage() {
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get('reset') === 'success';

  if (!resetSuccess) {
    return null;
  }

  return (
    <div className="mb-4 p-3 rounded-md bg-green-50 border border-green-200">
      <p className="text-sm text-green-700">
        Sua senha foi redefinida com sucesso. Faca login com a nova senha.
      </p>
    </div>
  );
}

function LoginContent() {
  const router = useRouter();
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
          Entrar
        </CardTitle>
        <CardDescription className="text-center">
          Entre com suas credenciais
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
