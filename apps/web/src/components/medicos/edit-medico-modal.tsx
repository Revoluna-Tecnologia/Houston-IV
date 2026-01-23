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
import { Switch } from '@/components/ui/switch';
import { Modal } from '@/components/houston';
import type { Especialidade, Medico, UpdateMedicoDto } from '../../services/types';

const UF_OPTIONS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

const editMedicoSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no minimo 3 caracteres'),
  crm: z.string().min(4, 'CRM deve ter no minimo 4 caracteres'),
  crmUf: z.string().min(2, 'UF e obrigatoria'),
  cpf: z.string().optional(),
  email: z.string().email('Email invalido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  especialidadeId: z.string().min(1, 'Especialidade e obrigatoria'),
  ativo: z.boolean(),
});

type EditMedicoFormData = z.infer<typeof editMedicoSchema>;

export interface EditMedicoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medico: Medico | null;
  onSubmit: (id: string, data: UpdateMedicoDto) => Promise<void>;
  especialidades: Especialidade[];
}

export function EditMedicoModal({
  open,
  onOpenChange,
  medico,
  onSubmit,
  especialidades,
}: EditMedicoModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatCpfForDisplay = (cpf: string | null) => {
    if (!cpf) return '';
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2');
  };

  const formatPhoneForDisplay = (phone: string | null) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      return cleaned
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return cleaned
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EditMedicoFormData>({
    resolver: zodResolver(editMedicoSchema),
    defaultValues: {
      nome: '',
      crm: '',
      crmUf: '',
      cpf: '',
      email: '',
      telefone: '',
      especialidadeId: '',
      ativo: true,
    },
  });

  useEffect(() => {
    if (medico) {
      reset({
        nome: medico.nome,
        crm: medico.crm,
        crmUf: medico.crmUf,
        cpf: formatCpfForDisplay(medico.cpf),
        email: medico.email || '',
        telefone: formatPhoneForDisplay(medico.telefone),
        especialidadeId: medico.especialidadeId,
        ativo: medico.ativo,
      });
    }
  }, [medico, reset]);

  const watchedCpf = watch('cpf');
  const watchedTelefone = watch('telefone');
  const watchedAtivo = watch('ativo');

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

  const handleFormSubmit = async (data: EditMedicoFormData) => {
    if (!medico) return;

    setIsSubmitting(true);
    try {
      const dto: UpdateMedicoDto = {
        nome: data.nome,
        crm: data.crm,
        crmUf: data.crmUf,
        especialidadeId: data.especialidadeId,
        cpf: data.cpf ? data.cpf.replace(/\D/g, '') : undefined,
        email: data.email || undefined,
        telefone: data.telefone ? data.telefone.replace(/\D/g, '') : undefined,
      };
      await onSubmit(medico.id, dto);
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

  if (!medico) return null;

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      title="Editar Medico"
      description="Atualize os dados do medico"
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome Completo *</Label>
          <Input
            id="nome"
            placeholder="Nome do medico"
            {...register('nome')}
          />
          {errors.nome && (
            <p className="text-sm text-red-500">{errors.nome.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="crm">CRM *</Label>
            <Input
              id="crm"
              placeholder="Numero do CRM"
              {...register('crm')}
            />
            {errors.crm && (
              <p className="text-sm text-red-500">{errors.crm.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="crmUf">UF do CRM *</Label>
            <Select
              value={watch('crmUf')}
              onValueChange={(value) => setValue('crmUf', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a UF" />
              </SelectTrigger>
              <SelectContent>
                {UF_OPTIONS.map((uf) => (
                  <SelectItem key={uf} value={uf}>
                    {uf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.crmUf && (
              <p className="text-sm text-red-500">{errors.crmUf.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cpf">CPF</Label>
          <Input
            id="cpf"
            placeholder="000.000.000-00"
            value={watchedCpf}
            onChange={handleCpfChange}
          />
          {errors.cpf && (
            <p className="text-sm text-red-500">{errors.cpf.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="especialidadeId">Especialidade *</Label>
          <Select
            value={watch('especialidadeId')}
            onValueChange={(value) => setValue('especialidadeId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a especialidade" />
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
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="email@exemplo.com"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            placeholder="(00) 00000-0000"
            value={watchedTelefone}
            onChange={handlePhoneChange}
          />
          {errors.telefone && (
            <p className="text-sm text-red-500">{errors.telefone.message}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Switch
            id="ativo"
            checked={watchedAtivo}
            onCheckedChange={(checked) => setValue('ativo', checked)}
          />
          <Label htmlFor="ativo">Medico ativo</Label>
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
