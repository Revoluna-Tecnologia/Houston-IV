'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Bell, User, Shield, Palette, Key } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SettingsPage() {
  const t = useTranslations('Settings')

  const SETTINGS_SECTIONS = [
    {
      key: 'notifications' as const,
      href: '/settings/notifications',
      icon: Bell,
    },
    {
      key: 'profile' as const,
      href: '/settings/profile',
      icon: User,
    },
    {
      key: 'security' as const,
      href: '/settings/security',
      icon: Shield,
    },
    {
      key: 'appearance' as const,
      href: '/settings/appearance',
      icon: Palette,
    },
    {
      key: 'apiKeys' as const,
      href: '/settings/api-keys',
      icon: Key,
    },
  ]

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('description')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon
          return (
            <Link key={section.href} href={section.href}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{t(`sections.${section.key}.title`)}</CardTitle>
                    <CardDescription>{t(`sections.${section.key}.description`)}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
