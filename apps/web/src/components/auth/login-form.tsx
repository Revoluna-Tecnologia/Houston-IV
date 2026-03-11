'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '../../hooks';

function createLoginSchema(t: (key: string) => string) {
  return z.object({
    email: z.string().email(t('invalidEmail')),
    password: z.string().min(8, t('minPassword')),
    rememberMe: z.boolean().optional(),
  });
}

type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>;

interface LoginFormProps {
  onSuccess?: () => void;
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.4 11.4H0V0h11.4v11.4z" fill="#F25022"/>
      <path d="M24 11.4H12.6V0H24v11.4z" fill="#7FBA00"/>
      <path d="M11.4 24H0V12.6h11.4V24z" fill="#00A4EF"/>
      <path d="M24 24H12.6V12.6H24V24z" fill="#FFB900"/>
    </svg>
  );
}

function MagicLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login, loginWithGoogle, loginWithMicrosoft, loginWithMagicLink } = useAuth();
  const t = useTranslations('Auth.login');
  const tErrors = useTranslations('Auth.loginErrors');
  const tMagicLink = useTranslations('Auth.magicLink');
  const tValidation = useTranslations('Common.validation');
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showMagicLinkInput, setShowMagicLinkInput] = useState(false);
  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const loginSchema = useMemo(() => createLoginSchema(tValidation), [tValidation]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await login(data.email, data.password);
      onSuccess?.();
    } catch (err) {
      if (err instanceof Error) {
        const message = err.message;
        if (message === 'ACESSO_NEGADO_NAO_ESCALISTA') {
          setError(tErrors('accessDenied'));
        } else if (message === 'ESCALISTA_STATUS_PENDENTE') {
          setError(tErrors('pendingApproval'));
        } else if (message === 'ESCALISTA_STATUS_INATIVO') {
          setError(tErrors('inactive'));
        } else {
          setError(message);
        }
      } else {
        setError(tErrors('generic'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSocialLoading('google');
    setError(null);
    try {
      await loginWithGoogle();
    } catch {
      setError(tErrors('googleError'));
    } finally {
      setIsSocialLoading(null);
    }
  };

  const handleMicrosoftLogin = async () => {
    setIsSocialLoading('microsoft');
    setError(null);
    try {
      await loginWithMicrosoft();
    } catch {
      setError(tErrors('microsoftError'));
    } finally {
      setIsSocialLoading(null);
    }
  };

  const handleMagicLinkLogin = async () => {
    if (!magicLinkEmail) {
      setError(tMagicLink('enterEmail'));
      return;
    }
    setIsSocialLoading('magiclink');
    setError(null);
    try {
      await loginWithMagicLink(magicLinkEmail);
      setMagicLinkSent(true);
    } catch {
      setError(tMagicLink('error'));
    } finally {
      setIsSocialLoading(null);
    }
  };

  if (showMagicLinkInput) {
    return (
      <div className="space-y-4">
        {magicLinkSent ? (
          <div className="p-4 rounded-md bg-green-50 border border-green-200">
            <p className="text-sm text-green-700 text-center"
              dangerouslySetInnerHTML={{ __html: tMagicLink('sent', { email: magicLinkEmail }) }}
            />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="magicLinkEmail" className="text-sm font-thin">{tMagicLink('emailLabel')}</Label>
              <Input
                id="magicLinkEmail"
                type="email"
                placeholder={tMagicLink('placeholder')}
                value={magicLinkEmail}
                onChange={(e) => setMagicLinkEmail(e.target.value)}
                disabled={isSocialLoading === 'magiclink'}
              />
            </div>
            {error && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            <Button
              type="button"
              className="w-full"
              onClick={handleMagicLinkLogin}
              disabled={isSocialLoading === 'magiclink'}
            >
              {isSocialLoading === 'magiclink' ? tMagicLink('submitting') : tMagicLink('submit')}
            </Button>
          </>
        )}
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => {
            setShowMagicLinkInput(false);
            setMagicLinkSent(false);
            setError(null);
          }}
        >
          {tMagicLink('backToLogin')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="p-3 rounded-md bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-thin">{t('email')}</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            disabled={isLoading}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-thin">{t('password')}</Label>
          <Input
            id="password"
            type="password"
            {...register('password')}
            disabled={isLoading}
          />
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="rememberMe"
            {...register('rememberMe')}
          />
          <Label htmlFor="rememberMe" className="text-sm font-thin cursor-pointer">
            {t('rememberMe')}
          </Label>
        </div>

        <div className="flex justify-end">
          <Link
            href="/auth/forgot-password"
            className="text-sm text-primary hover:underline font-thin"
          >
            {t('forgotPassword')}
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? t('submitting') : t('submit')}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">{t('orContinueWith')}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleLogin}
          disabled={!!isSocialLoading}
          className="w-full"
        >
          <GoogleIcon className="h-5 w-5" />
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleMicrosoftLogin}
          disabled={!!isSocialLoading}
          className="w-full"
        >
          <MicrosoftIcon className="h-5 w-5" />
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowMagicLinkInput(true)}
          disabled={!!isSocialLoading}
          className="w-full"
        >
          <MagicLinkIcon className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
