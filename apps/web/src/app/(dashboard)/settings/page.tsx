'use client'

import Link from 'next/link'
import { Bell, User, Shield, Palette, Key } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const SETTINGS_SECTIONS = [
  {
    title: 'Notificações',
    description: 'Gerencie suas preferências de notificação',
    href: '/settings/notifications',
    icon: Bell,
  },
  {
    title: 'Perfil',
    description: 'Atualize suas informações pessoais',
    href: '/settings/profile',
    icon: User,
  },
  {
    title: 'Segurança',
    description: 'Senha, autenticação e sessões',
    href: '/settings/security',
    icon: Shield,
  },
  {
    title: 'Aparência',
    description: 'Tema e preferências visuais',
    href: '/settings/appearance',
    icon: Palette,
  },
  {
    title: 'API Keys',
    description: 'Gerencie suas chaves de API',
    href: '/settings/api-keys',
    icon: Key,
  },
]

export default function SettingsPage() {
  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas preferências e configurações da conta
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
                    <CardTitle className="text-base">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
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
