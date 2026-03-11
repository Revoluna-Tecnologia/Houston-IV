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
import { Checkbox } from '@/components/ui/checkbox';
import { Modal } from '@/components/houston';
import type { UserRole } from '@/services/types';
import type { CreateUserDto } from '@/services/users-service';

function createUserSchema(t: (key: string) => string) {
  return z.object({
    nome: z.string().min(1, t('nameRequired')),
    email: z.string().email(t('invalidEmail')),
    password: z.string().min(8, t('passwordMin')),
    confirmPassword: z.string(),
    role: z.string().min(1, t('roleRequired')),
    grupoIds: z.array(z.string()),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('passwordsDontMatch'),
    path: ['confirmPassword'],
  });
}

type CreateUserFormData = z.infer<ReturnType<typeof createUserSchema>>;

export interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateUserDto) => Promise<void>;
  grupos: { id: string; nome: string }[];
}

export function CreateUserModal({
  open,
  onOpenChange,
  onSubmit,
  grupos,
}: CreateUserModalProps) {
  const t = useTranslations('Admin.users.form');
  const tValidation = useTranslations('Admin.users.validation');
  const tCommon = useTranslations('Common.actions');
  const tRoles = useTranslations('Common.roles');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = useMemo(() => createUserSchema(tValidation), [tValidation]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(schema),
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

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder={t('emailPlaceholder')}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="password">{t('password')}</Label>
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
            <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
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
          <Label htmlFor="role">{t('role')}</Label>
          <Select
            value={watchedRole}
            onValueChange={(value) => setValue('role', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('selectRole')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="administrador">{tRoles('administrator')}</SelectItem>
              <SelectItem value="moderador">{tRoles('moderator')}</SelectItem>
              <SelectItem value="gestor">{tRoles('manager')}</SelectItem>
              <SelectItem value="coordenador">{tRoles('coordinator')}</SelectItem>
              <SelectItem value="escalista">{tRoles('scheduler')}</SelectItem>
            </SelectContent>
          </Select>
          {errors.role && (
            <p className="text-sm text-red-500">{errors.role.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>{t('groups')}</Label>
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
