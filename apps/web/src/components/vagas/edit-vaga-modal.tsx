'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Modal, DatePicker } from '@/components/houston';
import type { Hospital, Vaga, UpdateVagaDto } from '../../services/types';

function createEditVagaSchema(t: (key: string) => string) {
  return z.object({
    data: z.date({ required_error: t('dateRequired') }),
    horaInicio: z.string().min(1, t('startTimeRequired')),
    horaFim: z.string().min(1, t('endTimeRequired')),
    valor: z.number().min(0, t('valueMin')),
    hospitalId: z.string().min(1, t('hospitalRequired')),
    setorId: z.string().min(1, t('sectorRequired')),
    especialidadeId: z.string().min(1, t('specialtyRequired')),
    observacoes: z.string().optional(),
  });
}

type EditVagaFormData = z.infer<ReturnType<typeof createEditVagaSchema>>;

export interface EditVagaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vaga: Vaga | null;
  onSubmit: (id: string, data: UpdateVagaDto) => Promise<void>;
  hospitals: Hospital[];
  setores: { id: string; nome: string; hospitalId: string }[];
  especialidades: { id: string; nome: string }[];
}

export function EditVagaModal({
  open,
  onOpenChange,
  vaga,
  onSubmit,
  hospitals,
  setores,
  especialidades,
}: EditVagaModalProps) {
  const t = useTranslations('Vagas.form');
  const tValidation = useTranslations('Vagas.validation');
  const tCommon = useTranslations('Common.actions');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = useMemo(() => createEditVagaSchema(tValidation), [tValidation]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EditVagaFormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (vaga && open) {
      const vagaDate = typeof vaga.data === 'string' ? new Date(vaga.data) : vaga.data;
      reset({
        data: vagaDate,
        horaInicio: vaga.horaInicio,
        horaFim: vaga.horaFim,
        valor: vaga.valor,
        hospitalId: vaga.hospitalId,
        setorId: vaga.setorId,
        especialidadeId: vaga.especialidadeId,
        observacoes: vaga.observacoes || '',
      });
    }
  }, [vaga, open, reset]);

  const watchedHospitalId = watch('hospitalId');
  const watchedData = watch('data');

  const filteredSetores = watchedHospitalId
    ? setores.filter((s) => s.hospitalId === watchedHospitalId)
    : [];

  const handleFormSubmit = async (data: EditVagaFormData) => {
    if (!vaga) return;

    setIsSubmitting(true);
    try {
      const dto: UpdateVagaDto = {
        data: data.data.toISOString().split('T')[0],
        horaInicio: data.horaInicio,
        horaFim: data.horaFim,
        valor: data.valor,
        hospitalId: data.hospitalId,
        setorId: data.setorId,
        especialidadeId: data.especialidadeId,
        observacoes: data.observacoes,
      };
      await onSubmit(vaga.id, dto);
      onOpenChange(false);
    } catch {
      // Error handled by onSubmit callback
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
      title={t('editTitle')}
      description={t('editDescription')}
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="data">{t('date')}</Label>
            <DatePicker
              value={watchedData}
              onChange={(date) => setValue('data', date as Date)}
              placeholder={t('selectDate')}
              className="w-full"
            />
            {errors.data && (
              <p className="text-sm text-red-500">{errors.data.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="horaInicio">{t('startTime')}</Label>
              <Input
                id="horaInicio"
                type="time"
                {...register('horaInicio')}
              />
              {errors.horaInicio && (
                <p className="text-sm text-red-500">{errors.horaInicio.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="horaFim">{t('endTime')}</Label>
              <Input
                id="horaFim"
                type="time"
                {...register('horaFim')}
              />
              {errors.horaFim && (
                <p className="text-sm text-red-500">{errors.horaFim.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="valor">{t('value')}</Label>
          <Input
            id="valor"
            type="number"
            step="0.01"
            min="0"
            {...register('valor', { valueAsNumber: true })}
          />
          {errors.valor && (
            <p className="text-sm text-red-500">{errors.valor.message}</p>
          )}
        </div>

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
              {hospitals.map((hospital) => (
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

        <div className="space-y-2">
          <Label htmlFor="especialidadeId">{t('specialty')}</Label>
          <Select
            value={watch('especialidadeId')}
            onValueChange={(value) => setValue('especialidadeId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('selectSpecialty')} />
            </SelectTrigger>
            <SelectContent>
              {especialidades.map((esp) => (
                <SelectItem key={esp.id} value={esp.id}>
                  {esp.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.especialidadeId && (
            <p className="text-sm text-red-500">{errors.especialidadeId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="observacoes">{t('notes')}</Label>
          <Textarea
            id="observacoes"
            placeholder={t('notesPlaceholder')}
            {...register('observacoes')}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            {tCommon('cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? tCommon('saving') : t('saveButton')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
