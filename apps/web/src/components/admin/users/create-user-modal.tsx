'use client';

import { useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Modal } from '@/components/houston';
import type { UserRole } from '../../../services/types';
import type { CreateUserDto } from '../../../services/users-service';

const createUserSchema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio'),
  email: z.string().email('Email invalido'),
  password: z.string().min(8, 'Senha deve ter no minimo 8 caracteres'),
  confirmPassword: z.string(),
  role: z.string().min(1, 'Funcao e obrigatoria'),
  grupoIds: z.array(z.string()),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas nao coincidem',
  path: ['confirmPassword'],
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

export interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateUserDto) => Promise<void>;
  grupos: { id: string; nome: string }[];
}

const ROLE_OPTIONS = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'moderador', label: 'Moderador' },
  { value: 'gestor', label: 'Gestor' },
  { value: 'coordenador', label: 'Coordenador' },
  { value: 'escalista', label: 'Escalista' },
];

export function CreateUserModal({
  open,
  onOpenChange,
  onSubmit,
  grupos,
}: CreateUserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      nome: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: '',
      grupoIds: [],
    },
  });

  const watchedRole = watch('role');
  const watchedGrupoIds = watch('grupoIds');

  const handleGrupoToggle = (grupoId: string) => {
    const current = watchedGrupoIds || [];
    if (current.includes(grupoId)) {
      setValue('grupoIds', current.filter((id) => id !== grupoId));
    } else {
      setValue('grupoIds', [...current, grupoId]);
    }
  };

  const handleFormSubmit = async (data: CreateUserFormData) => {
    setIsSubmitting(true);
    try {
      const dto: CreateUserDto = {
        nome: data.nome,
        email: data.email,
        password: data.password,
        role: data.role as UserRole,
        grupoIds: data.grupoIds,
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
      title="Novo Usuario"
      description="Preencha os dados para criar um novo usuario"
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome</Label>
          <Input
            id="nome"
            placeholder="Nome completo"
            {...register('nome')}
          />
          {errors.nome && (
            <p className="text-sm text-red-500">{errors.nome.message}</p>
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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="******"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="******"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Funcao</Label>
          <Select
            value={watchedRole}
            onValueChange={(value) => setValue('role', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a funcao" />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.role && (
            <p className="text-sm text-red-500">{errors.role.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Grupos</Label>
          <div className="border rounded-lg p-4 space-y-2 max-h-[200px] overflow-y-auto">
            {grupos.map((grupo) => (
              <label
                key={grupo.id}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Checkbox
                  checked={watchedGrupoIds?.includes(grupo.id) || false}
                  onCheckedChange={() => handleGrupoToggle(grupo.id)}
                />
                <span className="text-sm">{grupo.nome}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Criando...' : 'Criar Usuario'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
