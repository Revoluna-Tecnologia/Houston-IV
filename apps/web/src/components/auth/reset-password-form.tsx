'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { resetPassword } from '@/lib/auth-client'

function createResetPasswordSchema(t: (key: string) => string) {
  return z.object({
    password: z.string().min(8, t('minPassword')),
    confirmPassword: z.string().min(8, t('minConfirm')),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('passwordsDontMatch'),
    path: ['confirmPassword'],
  })
}

type ResetPasswordFormData = z.infer<ReturnType<typeof createResetPasswordSchema>>

interface ResetPasswordFormProps {
  token: string
}

function getPasswordStrength(password: string, t: (key: string) => string): { score: number; label: string; color: string } {
  let score = 0

  if (password.length >= 8) score += 1
  if (password.length >= 10) score += 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^a-zA-Z0-9]/.test(password)) score += 1

  if (score <= 1) return { score: 20, label: t('veryWeak'), color: 'bg-red-500' }
  if (score === 2) return { score: 40, label: t('weak'), color: 'bg-orange-500' }
  if (score === 3) return { score: 60, label: t('fair'), color: 'bg-yellow-500' }
  if (score === 4) return { score: 80, label: t('strong'), color: 'bg-green-400' }
  return { score: 100, label: t('veryStrong'), color: 'bg-green-600' }
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter()
  const t = useTranslations('Auth.resetPassword')
  const tValidation = useTranslations('Auth.resetPassword.validation')
  const tStrength = useTranslations('Auth.resetPassword.strength')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetPasswordSchema = useMemo(() => createResetPasswordSchema(tValidation), [tValidation])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const password = watch('password')
  const passwordStrength = getPasswordStrength(password || '', tStrength)

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      await resetPassword({
        token,
        newPassword: data.password,
      })
      router.push('/auth/login?reset=success')
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="password">{t('newPassword')}</Label>
        <Input
          id="password"
          type="password"
          placeholder="********"
          {...register('password')}
          disabled={isLoading}
        />
        {password && (
          <div className="space-y-1">
            <Progress value={passwordStrength.score} className="h-2" />
            <p className={`text-xs ${passwordStrength.score >= 60 ? 'text-green-600' : 'text-gray-500'}`}>
              {tStrength('label')}{passwordStrength.label}
            </p>
          </div>
        )}
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="********"
          {...register('confirmPassword')}
          disabled={isLoading}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? t('submitting') : t('submit')}
      </Button>
    </form>
  )
}
