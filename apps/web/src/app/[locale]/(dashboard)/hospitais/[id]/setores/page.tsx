'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { hospitaisService } from '@/services'
import { apiClient } from '@/services/api-client'
import type { Hospital, Setor } from '@/services/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function HospitalSetoresPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const t = useTranslations('Hospitais')
  const [hospital, setHospital] = useState<Hospital | null>(null)
  const [setores, setSetores] = useState<Setor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [hospitalData, setoresData] = await Promise.all([
          hospitaisService.getById(id),
          apiClient.get<Setor[]>(`/setores?hospitalId=${id}`),
        ])
        setHospital(hospitalData)
        setSetores(Array.isArray(setoresData) ? setoresData : [])
      } catch {
        setError(t('detail.hospitalNotFound'))
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

  if (error || !hospital) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">{error || t('detail.hospitalNotFound')}</div>
        <Button className="mt-4" variant="outline" onClick={() => router.push('/hospitais')}>
          {t('detail.back')}
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/hospitais')}>
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
              <CardTitle className="text-xl">{hospital.nome}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={hospital.ativo ? 'default' : 'outline'}>
                  {hospital.ativo ? t('detail.active') : t('detail.inactive')}
                </Badge>
                {hospital.cidade && (
                  <span className="text-sm text-muted-foreground">
                    {hospital.cidade}{hospital.estado ? ` - ${hospital.estado}` : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {hospital.cnpj && (
              <div>
                <span className="font-medium text-muted-foreground">{t('detail.cnpj')}</span>
                <p>{hospital.cnpj}</p>
              </div>
            )}
            {hospital.telefone && (
              <div>
                <span className="font-medium text-muted-foreground">{t('detail.phone')}</span>
                <p>{hospital.telefone}</p>
              </div>
            )}
            {hospital.email && (
              <div>
                <span className="font-medium text-muted-foreground">{t('detail.email')}</span>
                <p>{hospital.email}</p>
              </div>
            )}
            {hospital.endereco && (
              <div>
                <span className="font-medium text-muted-foreground">{t('detail.address')}</span>
                <p>{hospital.endereco}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('detail.sectors')} ({setores.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {setores.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">{t('detail.noSectors')}</p>
          ) : (
            <div className="divide-y">
              {setores.map((setor) => (
                <div key={setor.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{setor.nome}</p>
                    {setor.descricao && (
                      <p className="text-sm text-muted-foreground">{setor.descricao}</p>
                    )}
                  </div>
                  <Badge variant={setor.ativo ? 'default' : 'outline'}>
                    {setor.ativo ? t('detail.active') : t('detail.inactive')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
