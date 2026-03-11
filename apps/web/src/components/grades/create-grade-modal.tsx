'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Modal } from '@/components/houston';
import type { Hospital, CreateGradeDto } from '@/services/types';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

function createGradeSchema(t: (key: string) => string) {
  return z.object({
    nome: z.string().min(1, t('nameRequired')),
    hospitalId: z.string().min(1, t('hospitalRequired')),
    setorId: z.string().min(1, t('sectorRequired')),
    mes: z.number().min(1).max(12),
    ano: z.number().min(currentYear - 2).max(currentYear + 2),
  });
}

type CreateGradeFormData = z.infer<ReturnType<typeof createGradeSchema>>;

export interface CreateGradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateGradeDto) => Promise<void>;
  hospitais: Hospital[];
  setores: { id: string; nome: string; hospitalId: string }[];
}

const MONTH_KEYS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
] as const;

const ANOS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

export function CreateGradeModal({
  open,
  onOpenChange,
  onSubmit,
  hospitais,
  setores,
}: CreateGradeModalProps) {
  const t = useTranslations('Grades.form');
  const tValidation = useTranslations('Grades.validation');
  const tCommon = useTranslations('Common.actions');
  const tMonths = useTranslations('Common.months');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = useMemo(() => createGradeSchema(tValidation), [tValidation]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateGradeFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: '',
      hospitalId: '',
      setorId: '',
      mes: currentMonth,
      ano: currentYear,
    },
  });

  const watchedHospitalId = watch('hospitalId');
  const watchedMes = watch('mes');
  const watchedAno = watch('ano');

  const filteredSetores = watchedHospitalId
    ? setores.filter((s) => s.hospitalId === watchedHospitalId)
    : [];

  const handleFormSubmit = async (data: CreateGradeFormData) => {
    setIsSubmitting(true);
    try {
      const dto: CreateGradeDto = {
        nome: data.nome,
        hospitalId: data.hospitalId,
        setorId: data.setorId,
        mes: data.mes,
        ano: data.ano,
      };
      await onSubmit(dto);
      reset();
      onOpenChange(false);
    } catch {
      // Error handling silently
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      title={t('createTitle')}
      description={t('createDescription')}
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nome">{t('name')}</Label>
          <Input
            id="nome"
            placeholder={t('namePlaceholder')}
            {...register('nome')}
          />
          {errors.nome && (
            <p className="text-sm text-red-500">{errors.nome.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hospitalId">{t('hospital')}</Label>
            <Select
              value={watchedHospitalId}
              onValueChange={(value) => {
                setValue('hospitalId', value);
                setValue('setorId', '');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('selectHospital')} />
              </SelectTrigger>
              <SelectContent>
                {hospitais.map((hospital) => (
                  <SelectItem key={hospital.id} value={hospital.id}>
                    {hospital.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.hospitalId && (
              <p className="text-sm text-red-500">{errors.hospitalId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="setorId">{t('sector')}</Label>
            <Select
              value={watch('setorId')}
              onValueChange={(value) => setValue('setorId', value)}
              disabled={!watchedHospitalId}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('selectSector')} />
              </SelectTrigger>
              <SelectContent>
                {filteredSetores.map((setor) => (
                  <SelectItem key={setor.id} value={setor.id}>
                    {setor.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.setorId && (
              <p className="text-sm text-red-500">{errors.setorId.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="mes">{t('month')}</Label>
            <Select
              value={watchedMes?.toString()}
              onValueChange={(value) => setValue('mes', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('selectMonth')} />
              </SelectTrigger>
              <SelectContent>
                {MONTH_KEYS.map((key, index) => (
                  <SelectItem key={index + 1} value={(index + 1).toString()}>
                    {tMonths(key)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.mes && (
              <p className="text-sm text-red-500">{errors.mes.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ano">{t('year')}</Label>
            <Select
              value={watchedAno?.toString()}
              onValueChange={(value) => setValue('ano', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('selectYear')} />
              </SelectTrigger>
              <SelectContent>
                {ANOS.map((ano) => (
                  <SelectItem key={ano} value={ano.toString()}>
                    {ano}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.ano && (
              <p className="text-sm text-red-500">{errors.ano.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            {tCommon('cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? tCommon('creating') : t('createButton')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
