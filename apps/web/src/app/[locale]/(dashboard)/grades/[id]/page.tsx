'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { gradesService } from '@/services'
import type { Grade, TimeSlot } from '@/services/types'
import { GradeStatus } from '@/services/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function GradeDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const t = useTranslations('Grades')
  const tc = useTranslations('Common')
  const [grade, setGrade] = useState<Grade | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    rascunho: { label: t('statusLabels.draft'), variant: 'secondary' },
    publicada: { label: t('statusLabels.published'), variant: 'default' },
    arquivada: { label: t('statusLabels.archived'), variant: 'outline' },
  }

  const MESES = [
    tc('months.january'), tc('months.february'), tc('months.march'),
    tc('months.april'), tc('months.may'), tc('months.june'),
    tc('months.july'), tc('months.august'), tc('months.september'),
    tc('months.october'), tc('months.november'), tc('months.december'),
  ]

  useEffect(() => {
    async function load() {
      try {
        const data = await gradesService.getById(id)
        setGrade(data)
      } catch {
        setError(t('detail.gradeNotFound'))
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [id])

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !grade) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">{error || t('detail.gradeNotFound')}</div>
        <Button className="mt-4" variant="outline" onClick={() => router.push('/grades')}>
          {t('detail.back')}
        </Button>
      </div>
    )
  }

  const status = statusConfig[grade.status] || statusConfig.rascunho

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/grades')}>
          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('detail.back')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{grade.nome}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={status.variant}>{status.label}</Badge>
                <span className="text-sm text-muted-foreground">
                  {MESES[grade.mes - 1]} / {grade.ano}
                </span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Criado em {new Date(grade.createdAt).toLocaleDateString('pt-BR')}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Hospital ID</h4>
              <p>{grade.hospitalId}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Setor ID</h4>
              <p>{grade.setorId}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">{t('detail.period')}</h4>
              <p>{MESES[grade.mes - 1]} de {grade.ano}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Status</h4>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
