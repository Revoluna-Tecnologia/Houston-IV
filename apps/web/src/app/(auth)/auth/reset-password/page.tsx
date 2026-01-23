import { Suspense } from 'react';
import { ResetPasswordContent } from './reset-password-content';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8">Carregando...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
