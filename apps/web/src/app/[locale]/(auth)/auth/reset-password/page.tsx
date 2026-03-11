'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { ResetPasswordContent } from './reset-password-content';

export default function ResetPasswordPage() {
  const t = useTranslations('Common.actions');

  return (
    <Suspense fallback={<div className="flex justify-center p-8">{t('loading')}</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
