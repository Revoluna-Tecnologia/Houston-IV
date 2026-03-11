'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Modal } from '@/components/houston';
import type { Especialidade, Medico, UpdateMedicoDto } from '../../services/types';

const UF_OPTIONS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

function createEditMedicoSchema(t: (key: string) => string) {
  return z.object({
    nome: z.string().min(3, t('nameMin')),
    crm: z.string().min(4, t('crmMin')),
    crmUf: z.string().min(2, t('ufRequired')),
    cpf: z.string().optional(),
    email: z.string().email(t('invalidEmail')).optional().or(z.literal('')),
    telefone: z.string().optional(),
    especialidadeId: z.string().min(1, t('specialtyRequired')),
    ativo: z.boolean(),
  });
}

type EditMedicoFormData = z.infer<ReturnType<typeof createEditMedicoSchema>>;

export interface EditMedicoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medico: Medico | null;
  onSubmit: (id: string, data: UpdateMedicoDto) => Promise<void>;
  especialidades: Especialidade[];
}

export function EditMedicoModal({ open, onOpenChange, medico, onSubmit, especialidades }: EditMedicoModalProps) {
  const t = useTranslations('Medicos.form');
  const tValidation = useTranslations('Medicos.validation');
  const tCommon = useTranslations('Common.actions');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = useMemo(() => createEditMedicoSchema(tValidation), [tValidation]);

  const formatCpfForDisplay = (cpf: string | null) => {
    if (!cpf) return '';
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2');
  };

  const formatPhoneForDisplay = (phone: string | null) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length <= 10) return cleaned.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
    return cleaned.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
  };

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<EditMedicoFormData>({
    resolver: zodResolver(schema),
    defaultValues: { nome: '', crm: '', crmUf: '', cpf: '', email: '', telefone: '', especialidadeId: '', ativo: true },
  });

  useEffect(() => {
    if (medico) {
      reset({
        nome: medico.nome, crm: medico.crm, crmUf: medico.crmUf,
        cpf: formatCpfForDisplay(medico.cpf), email: medico.email || '',
        telefone: formatPhoneForDisplay(medico.telefone), especialidadeId: medico.especialidadeId, ativo: medico.ativo,
      });
    }
  }, [medico, reset]);

  const watchedCpf = watch('cpf');
  const watchedTelefone = watch('telefone');
  const watchedAtivo = watch('ativo');

  const formatCpf = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 11);
    return cleaned.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2');
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 11);
    if (cleaned.length <= 10) return cleaned.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
    return cleaned.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => setValue('cpf', formatCpf(e.target.value));
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => setValue('telefone', formatPhone(e.target.value));

  const handleFormSubmit = async (data: EditMedicoFormData) => {
    if (!medico) return;
    setIsSubmitting(true);
    try {
      const dto: UpdateMedicoDto = {
        nome: data.nome, crm: data.crm, crmUf: data.crmUf, especialidadeId: data.especialidadeId,
        cpf: data.cpf ? data.cpf.replace(/\D/g, '') : undefined,
        email: data.email || undefined,
        telefone: data.telefone ? data.telefone.replace(/\D/g, '') : undefined,
      };
      await onSubmit(medico.id, dto);
      onOpenChange(false);
    } catch { /* Error handled by onSubmit callback */ } finally { setIsSubmitting(false); }
  };

  const handleClose = () => { reset(); onOpenChange(false); };
  if (!medico) return null;

  return (
    <Modal open={open} onOpenChange={handleClose} title={t('editTitle')} description={t('editDescription')} size="lg">
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
              <SelectContent>{UF_OPTIONS.map((uf) => (<SelectItem key={uf} value={uf}>{uf}</SelectItem>))}</SelectContent>
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
            <SelectContent>{especialidades.map((esp) => (<SelectItem key={esp.id} value={esp.id}>{esp.nome}</SelectItem>))}</SelectContent>
          </Select>
          {errors.especialidadeId && <p className="text-sm text-red-500">{errors.especialidadeId.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder={t('emailPlaceholder')} {...register('email')} />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefone">{t('phone')}</Label>
          <Input id="telefone" placeholder="(00) 00000-0000" value={watchedTelefone} onChange={handlePhoneChange} />
          {errors.telefone && <p className="text-sm text-red-500">{errors.telefone.message}</p>}
        </div>

        <div className="flex items-center gap-3">
          <Switch id="ativo" checked={watchedAtivo} onCheckedChange={(checked) => setValue('ativo', checked)} />
          <Label htmlFor="ativo">{t('activeSwitch')}</Label>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={handleClose}>{tCommon('cancel')}</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? tCommon('saving') : tCommon('saveChanges')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
