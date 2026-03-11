'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Modal } from '@/components/houston';
import type { CreateHospitalDto } from '../../services/types';

function createHospitalSchema(t: (key: string) => string) {
  return z.object({
    nome: z.string().min(1, t('nameRequired')),
    grupoId: z.string().min(1, t('groupRequired')),
    cnpj: z.string().optional(),
    endereco: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().optional(),
    cep: z.string().optional(),
    telefone: z.string().optional(),
    email: z.string().email(t('invalidEmail')).optional().or(z.literal('')),
  });
}

type CreateHospitalFormData = z.infer<ReturnType<typeof createHospitalSchema>>;

export interface CreateHospitalModalProps {
  open: boolean; onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateHospitalDto) => Promise<void>;
  grupos: { id: string; nome: string }[];
}

const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export function CreateHospitalModal({ open, onOpenChange, onSubmit, grupos }: CreateHospitalModalProps) {
  const t = useTranslations('Hospitais.form');
  const tValidation = useTranslations('Hospitais.validation');
  const tCommon = useTranslations('Common.actions');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = useMemo(() => createHospitalSchema(tValidation), [tValidation]);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<CreateHospitalFormData>({
    resolver: zodResolver(schema),
    defaultValues: { nome: '', grupoId: '', cnpj: '', endereco: '', cidade: '', estado: '', cep: '', telefone: '', email: '' },
  });

  const watchedGrupoId = watch('grupoId');
  const watchedEstado = watch('estado');

  const formatCnpj = (value: string) => { const n = value.replace(/\D/g, ''); return n.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2').slice(0, 18); };
  const formatCep = (value: string) => { const n = value.replace(/\D/g, ''); return n.replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9); };
  const formatTelefone = (value: string) => { const n = value.replace(/\D/g, ''); if (n.length <= 10) return n.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2').slice(0, 14); return n.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15); };

  const handleFormSubmit = async (data: CreateHospitalFormData) => {
    setIsSubmitting(true);
    try {
      const dto: CreateHospitalDto = { nome: data.nome, grupoId: data.grupoId, cnpj: data.cnpj?.replace(/\D/g, '') || undefined, endereco: data.endereco || undefined, cidade: data.cidade || undefined, estado: data.estado || undefined, cep: data.cep?.replace(/\D/g, '') || undefined, telefone: data.telefone?.replace(/\D/g, '') || undefined, email: data.email || undefined };
      await onSubmit(dto); reset(); onOpenChange(false);
    } catch { /* Error handling */ } finally { setIsSubmitting(false); }
  };

  const handleClose = () => { reset(); onOpenChange(false); };

  return (
    <Modal open={open} onOpenChange={handleClose} title={t('createTitle')} description={t('createDescription')} size="lg">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nome">{t('name')}</Label>
            <Input id="nome" placeholder={t('namePlaceholder')} {...register('nome')} />
            {errors.nome && <p className="text-sm text-red-500">{errors.nome.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="grupoId">{t('group')}</Label>
            <Select value={watchedGrupoId} onValueChange={(value) => setValue('grupoId', value)}>
              <SelectTrigger><SelectValue placeholder={t('selectGroup')} /></SelectTrigger>
              <SelectContent>{grupos.map((grupo) => (<SelectItem key={grupo.id} value={grupo.id}>{grupo.nome}</SelectItem>))}</SelectContent>
            </Select>
            {errors.grupoId && <p className="text-sm text-red-500">{errors.grupoId.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label htmlFor="cnpj">CNPJ</Label><Input id="cnpj" placeholder="00.000.000/0000-00" value={watch('cnpj')} onChange={(e) => setValue('cnpj', formatCnpj(e.target.value))} /></div>
          <div className="space-y-2"><Label htmlFor="telefone">{t('phone')}</Label><Input id="telefone" placeholder="(00) 00000-0000" value={watch('telefone')} onChange={(e) => setValue('telefone', formatTelefone(e.target.value))} /></div>
        </div>

        <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder={t('emailPlaceholder')} {...register('email')} />{errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}</div>
        <div className="space-y-2"><Label htmlFor="endereco">{t('address')}</Label><Input id="endereco" placeholder={t('addressPlaceholder')} {...register('endereco')} /></div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2"><Label htmlFor="cep">CEP</Label><Input id="cep" placeholder="00000-000" value={watch('cep')} onChange={(e) => setValue('cep', formatCep(e.target.value))} /></div>
          <div className="space-y-2"><Label htmlFor="cidade">{t('city')}</Label><Input id="cidade" placeholder={t('cityPlaceholder')} {...register('cidade')} /></div>
          <div className="space-y-2"><Label htmlFor="estado">{t('state')}</Label>
            <Select value={watchedEstado} onValueChange={(value) => setValue('estado', value)}>
              <SelectTrigger><SelectValue placeholder={t('statePlaceholder')} /></SelectTrigger>
              <SelectContent>{ESTADOS.map((uf) => (<SelectItem key={uf} value={uf}>{uf}</SelectItem>))}</SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={handleClose}>{tCommon('cancel')}</Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? tCommon('creating') : t('createButton')}</Button>
        </div>
      </form>
    </Modal>
  );
}
