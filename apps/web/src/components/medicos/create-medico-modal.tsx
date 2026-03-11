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
import type { Especialidade, CreateMedicoDto } from '../../services/types';

const UF_OPTIONS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

function createMedicoSchema(t: (key: string) => string) {
  return z.object({
    nome: z.string().min(3, t('nameMin')),
    crm: z.string().min(4, t('crmMin')),
    crmUf: z.string().min(2, t('ufRequired')),
    cpf: z.string().optional(),
    email: z.string().email(t('invalidEmail')).optional().or(z.literal('')),
    telefone: z.string().optional(),
    especialidadeId: z.string().min(1, t('specialtyRequired')),
  });
}

type CreateMedicoFormData = z.infer<ReturnType<typeof createMedicoSchema>>;

export interface CreateMedicoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateMedicoDto) => Promise<void>;
  especialidades: Especialidade[];
}

export function CreateMedicoModal({
  open,
  onOpenChange,
  onSubmit,
  especialidades,
}: CreateMedicoModalProps) {
  const t = useTranslations('Medicos.form');
  const tValidation = useTranslations('Medicos.validation');
  const tCommon = useTranslations('Common.actions');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = useMemo(() => createMedicoSchema(tValidation), [tValidation]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateMedicoFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: '',
      crm: '',
      crmUf: '',
      cpf: '',
      email: '',
      telefone: '',
      especialidadeId: '',
    },
  });

  const watchedCpf = watch('cpf');
  const watchedTelefone = watch('telefone');

  const formatCpf = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const limited = cleaned.slice(0, 11);
    return limited
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2');
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const limited = cleaned.slice(0, 11);
    if (limited.length <= 10) {
      return limited
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return limited
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCpf(e.target.value);
    setValue('cpf', formatted);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setValue('telefone', formatted);
  };

  const handleFormSubmit = async (data: CreateMedicoFormData) => {
    setIsSubmitting(true);
    try {
      const dto: CreateMedicoDto = {
        nome: data.nome,
        crm: data.crm,
        crmUf: data.crmUf,
        especialidadeId: data.especialidadeId,
        cpf: data.cpf ? data.cpf.replace(/\D/g, '') : undefined,
        email: data.email || undefined,
        telefone: data.telefone ? data.telefone.replace(/\D/g, '') : undefined,
      };
      await onSubmit(dto);
      reset();
      onOpenChange(false);
    } catch {
      // Error is expected to be handled by the onSubmit callback via toast
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
          <Label htmlFor="nome">{t('fullName')}</Label>
          <Input id="nome" placeholder={t('namePlaceholder')} {...register('nome')} />
          {errors.nome && <p className="text-sm text-red-500">{errors.nome.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="crm">{t('crm')}</Label>
            <Input id="crm" placeholder={t('crmPlaceholder')} {...register('crm')} />
            {errors.crm && <p className="text-sm text-red-500">{errors.crm.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="crmUf">{t('crmUf')}</Label>
            <Select value={watch('crmUf')} onValueChange={(value) => setValue('crmUf', value)}>
              <SelectTrigger><SelectValue placeholder={t('selectUf')} /></SelectTrigger>
              <SelectContent>
                {UF_OPTIONS.map((uf) => (<SelectItem key={uf} value={uf}>{uf}</SelectItem>))}
              </SelectContent>
            </Select>
            {errors.crmUf && <p className="text-sm text-red-500">{errors.crmUf.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cpf">CPF</Label>
          <Input id="cpf" placeholder="000.000.000-00" value={watchedCpf} onChange={handleCpfChange} />
          {errors.cpf && <p className="text-sm text-red-500">{errors.cpf.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="especialidadeId">{t('specialty')}</Label>
          <Select value={watch('especialidadeId')} onValueChange={(value) => setValue('especialidadeId', value)}>
            <SelectTrigger><SelectValue placeholder={t('selectSpecialty')} /></SelectTrigger>
            <SelectContent>
              {especialidades.map((esp) => (<SelectItem key={esp.id} value={esp.id}>{esp.nome}</SelectItem>))}
            </SelectContent>
          </Select>
          {errors.especialidadeId && <p className="text-sm text-red-500">{errors.especialidadeId.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{tCommon('search') ? 'Email' : 'Email'}</Label>
          <Input id="email" type="email" placeholder={t('emailPlaceholder')} {...register('email')} />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefone">{t('phone')}</Label>
          <Input id="telefone" placeholder="(00) 00000-0000" value={watchedTelefone} onChange={handlePhoneChange} />
          {errors.telefone && <p className="text-sm text-red-500">{errors.telefone.message}</p>}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={handleClose}>{tCommon('cancel')}</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? tCommon('saving') : t('saveButton')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
