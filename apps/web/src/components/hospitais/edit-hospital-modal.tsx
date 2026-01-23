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
import type { Hospital, UpdateHospitalDto } from '../../services/types';

const editHospitalSchema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio'),
  grupoId: z.string().min(1, 'Grupo e obrigatorio'),
  cnpj: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  cep: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email('Email invalido').optional().or(z.literal('')),
  ativo: z.boolean(),
});

type EditHospitalFormData = z.infer<typeof editHospitalSchema>;

export interface EditHospitalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hospital: Hospital | null;
  onSubmit: (id: string, data: UpdateHospitalDto) => Promise<void>;
  grupos: { id: string; nome: string }[];
}

const ESTADOS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

export function EditHospitalModal({
  open,
  onOpenChange,
  hospital,
  onSubmit,
  grupos,
}: EditHospitalModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EditHospitalFormData>({
    resolver: zodResolver(editHospitalSchema),
  });

  useEffect(() => {
    if (hospital) {
      reset({
        nome: hospital.nome,
        grupoId: hospital.grupoId,
        cnpj: hospital.cnpj ? formatCnpj(hospital.cnpj) : '',
        endereco: hospital.endereco || '',
        cidade: hospital.cidade || '',
        estado: hospital.estado || '',
        cep: hospital.cep ? formatCep(hospital.cep) : '',
        telefone: hospital.telefone ? formatTelefone(hospital.telefone) : '',
        email: hospital.email || '',
        ativo: hospital.ativo,
      });
    }
  }, [hospital, reset]);

  const watchedGrupoId = watch('grupoId');
  const watchedEstado = watch('estado');
  const watchedAtivo = watch('ativo');

  const formatCnpj = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
  };

  const formatTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .slice(0, 14);
    }
    return numbers
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15);
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCnpj(e.target.value);
    setValue('cnpj', formatted);
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setValue('cep', formatted);
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatTelefone(e.target.value);
    setValue('telefone', formatted);
  };

  const handleFormSubmit = async (data: EditHospitalFormData) => {
    if (!hospital) return;
    setIsSubmitting(true);
    try {
      const dto: UpdateHospitalDto = {
        nome: data.nome,
        grupoId: data.grupoId,
        cnpj: data.cnpj?.replace(/\D/g, '') || undefined,
        endereco: data.endereco || undefined,
        cidade: data.cidade || undefined,
        estado: data.estado || undefined,
        cep: data.cep?.replace(/\D/g, '') || undefined,
        telefone: data.telefone?.replace(/\D/g, '') || undefined,
        email: data.email || undefined,
      };
      await onSubmit(hospital.id, dto);
      onOpenChange(false);
    } catch {
      // Error handling silently
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!hospital) return null;

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      title="Editar Hospital"
      description="Atualize os dados do hospital"
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              placeholder="Nome do hospital"
              {...register('nome')}
            />
            {errors.nome && (
              <p className="text-sm text-red-500">{errors.nome.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="grupoId">Grupo</Label>
            <Select
              value={watchedGrupoId}
              onValueChange={(value) => setValue('grupoId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o grupo" />
              </SelectTrigger>
              <SelectContent>
                {grupos.map((grupo) => (
                  <SelectItem key={grupo.id} value={grupo.id}>
                    {grupo.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.grupoId && (
              <p className="text-sm text-red-500">{errors.grupoId.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              placeholder="00.000.000/0000-00"
              value={watch('cnpj')}
              onChange={handleCnpjChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              placeholder="(00) 00000-0000"
              value={watch('telefone')}
              onChange={handleTelefoneChange}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="email@hospital.com"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="endereco">Endereco</Label>
          <Input
            id="endereco"
            placeholder="Rua, numero, bairro"
            {...register('endereco')}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cep">CEP</Label>
            <Input
              id="cep"
              placeholder="00000-000"
              value={watch('cep')}
              onChange={handleCepChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cidade">Cidade</Label>
            <Input
              id="cidade"
              placeholder="Cidade"
              {...register('cidade')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Select
              value={watchedEstado}
              onValueChange={(value) => setValue('estado', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="UF" />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS.map((uf) => (
                  <SelectItem key={uf} value={uf}>
                    {uf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={watchedAtivo}
            onCheckedChange={(checked) => setValue('ativo', checked)}
          />
          <Label>Hospital ativo</Label>
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
