'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import type { Hospital, Grade, UpdateGradeDto } from '../../services/types';

const currentYear = new Date().getFullYear();

const editGradeSchema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio'),
  hospitalId: z.string().min(1, 'Hospital e obrigatorio'),
  setorId: z.string().min(1, 'Setor e obrigatorio'),
  mes: z.number().min(1).max(12),
  ano: z.number().min(currentYear - 2).max(currentYear + 2),
});

type EditGradeFormData = z.infer<typeof editGradeSchema>;

export interface EditGradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grade: Grade | null;
  onSubmit: (id: string, data: UpdateGradeDto) => Promise<void>;
  hospitais: Hospital[];
  setores: { id: string; nome: string; hospitalId: string }[];
}

const MESES = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Marco' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

const ANOS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

export function EditGradeModal({
  open,
  onOpenChange,
  grade,
  onSubmit,
  hospitais,
  setores,
}: EditGradeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EditGradeFormData>({
    resolver: zodResolver(editGradeSchema),
  });

  useEffect(() => {
    if (grade) {
      reset({
        nome: grade.nome,
        hospitalId: grade.hospitalId,
        setorId: grade.setorId,
        mes: grade.mes,
        ano: grade.ano,
      });
    }
  }, [grade, reset]);

  const watchedHospitalId = watch('hospitalId');
  const watchedMes = watch('mes');
  const watchedAno = watch('ano');

  const filteredSetores = watchedHospitalId
    ? setores.filter((s) => s.hospitalId === watchedHospitalId)
    : [];

  const handleFormSubmit = async (data: EditGradeFormData) => {
    if (!grade) return;
    setIsSubmitting(true);
    try {
      const dto: UpdateGradeDto = {
        nome: data.nome,
        hospitalId: data.hospitalId,
        setorId: data.setorId,
        mes: data.mes,
        ano: data.ano,
      };
      await onSubmit(grade.id, dto);
      onOpenChange(false);
    } catch {
      // Error handled by onSubmit callback
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!grade) return null;

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      title="Editar Grade"
      description="Atualize os dados da grade"
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome</Label>
          <Input
            id="nome"
            placeholder="Nome da grade"
            {...register('nome')}
          />
          {errors.nome && (
            <p className="text-sm text-red-500">{errors.nome.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hospitalId">Hospital</Label>
            <Select
              value={watchedHospitalId}
              onValueChange={(value) => {
                setValue('hospitalId', value);
                setValue('setorId', '');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o hospital" />
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
            <Label htmlFor="setorId">Setor</Label>
            <Select
              value={watch('setorId')}
              onValueChange={(value) => setValue('setorId', value)}
              disabled={!watchedHospitalId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o setor" />
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
            <Label htmlFor="mes">Mes</Label>
            <Select
              value={watchedMes?.toString()}
              onValueChange={(value) => setValue('mes', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o mes" />
              </SelectTrigger>
              <SelectContent>
                {MESES.map((mes) => (
                  <SelectItem key={mes.value} value={mes.value.toString()}>
                    {mes.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.mes && (
              <p className="text-sm text-red-500">{errors.mes.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ano">Ano</Label>
            <Select
              value={watchedAno?.toString()}
              onValueChange={(value) => setValue('ano', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o ano" />
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
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar Alteracoes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
