'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestPasswordReset } from '@/lib/auth-client'

function createForgotPasswordSchema(t: (key: string) => string) {
  return z.object({
    email: z.string().email(t('invalidEmail')),
  })
}

type ForgotPasswordFormData = z.infer<ReturnType<typeof createForgotPasswordSchema>>

export function ForgotPasswordForm() {
  const t = useTranslations('Auth.forgotPassword')
  const tValidation = useTranslations('Auth.forgotPassword.validation')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const forgotPasswordSchema = useMemo(() => createForgotPasswordSchema(tValidation), [tValidation])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      await requestPasswordReset({
        email: data.email,
        redirectTo: '/auth/reset-password',
      })
      setIsSuccess(true)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError(t('error'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-md bg-green-50 border border-green-200">
          <p className="text-sm text-green-700">
            {t('success')}
          </p>
        </div>
        <Link
          href="/auth/login"
          className="block w-full text-center text-sm text-primary-500 hover:text-primary-600 hover:underline"
        >
          {t('backToLogin')}
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">{t('emailLabel')}</Label>
        <Input
          id="email"
          type="email"
          placeholder={t('emailPlaceholder')}
          {...register('email')}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? t('submitting') : t('submit')}
      </Button>

      <Link
        href="/auth/login"
        className="block w-full text-center text-sm text-primary-500 hover:text-primary-600 hover:underline"
      >
        {t('backToLogin')}
      </Link>
    </form>
  )
}
