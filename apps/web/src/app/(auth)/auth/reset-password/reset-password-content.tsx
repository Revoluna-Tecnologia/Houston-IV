'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ResetPasswordForm } from '../../../../components/auth';

export function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  if (!token) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Link invalido</CardTitle>
          <CardDescription>
            O link de redefinicao de senha e invalido ou expirou
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/auth/forgot-password"
            className="block w-full text-center text-sm text-primary-500 hover:text-primary-600 hover:underline"
          >
            Solicitar novo link
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Redefinir senha</CardTitle>
        <CardDescription>
          Digite sua nova senha abaixo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm token={token} />
      </CardContent>
    </Card>
  );
}
