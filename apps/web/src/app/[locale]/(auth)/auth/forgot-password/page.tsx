'use client';

import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ForgotPasswordForm } from '@/components/auth';

export default function ForgotPasswordPage() {
  const t = useTranslations('Auth.forgotPassword');

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>
          {t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm />
      </CardContent>
    </Card>
  );
}
