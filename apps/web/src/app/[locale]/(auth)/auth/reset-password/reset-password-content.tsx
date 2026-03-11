'use client';

import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ResetPasswordForm } from '@/components/auth';

export function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const t = useTranslations('Auth.resetPassword');
  const token = searchParams.get('token');

  if (!token) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle>{t('invalidLinkTitle')}</CardTitle>
          <CardDescription>
            {t('invalidLinkDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/auth/forgot-password"
            className="block w-full text-center text-sm text-primary-500 hover:text-primary-600 hover:underline"
          >
            {t('requestNewLink')}
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>
          {t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm token={token} />
      </CardContent>
    </Card>
  );
}
