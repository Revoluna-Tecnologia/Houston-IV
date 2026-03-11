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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Modal } from '@/components/houston';
import type { User, UserRole } from '@/services/types';
import type { UpdateUserDto } from '@/services/users-service';

function createEditUserSchema(t: (key: string) => string) {
  return z.object({
    nome: z.string().min(1, t('nameRequired')),
    role: z.string().min(1, t('roleRequired')),
    grupoIds: z.array(z.string()),
    ativo: z.boolean(),
  });
}

type EditUserFormData = z.infer<ReturnType<typeof createEditUserSchema>>;

export interface EditUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSubmit: (id: string, data: UpdateUserDto) => Promise<void>;
  grupos: { id: string; nome: string }[];
}

export function EditUserModal({
  open,
  onOpenChange,
  user,
  onSubmit,
  grupos,
}: EditUserModalProps) {
  const t = useTranslations('Admin.users.form');
  const tValidation = useTranslations('Admin.users.validation');
  const tCommon = useTranslations('Common.actions');
  const tRoles = useTranslations('Common.roles');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = useMemo(() => createEditUserSchema(tValidation), [tValidation]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EditUserFormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (user) {
      reset({
        nome: user.name,
        role: user.role,
        grupoIds: user.grupoIds,
        ativo: user.ativo,
      });
    }
  }, [user, reset]);

  const watchedRole = watch('role');
  const watchedGrupoIds = watch('grupoIds');
  const watchedAtivo = watch('ativo');

  const handleGrupoToggle = (grupoId: string) => {
    const current = watchedGrupoIds || [];
    if (current.includes(grupoId)) {
      setValue('grupoIds', current.filter((id) => id !== grupoId));
    } else {
      setValue('grupoIds', [...current, grupoId]);
    }
  };

  const handleFormSubmit = async (data: EditUserFormData) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const dto: UpdateUserDto = {
        nome: data.nome,
        role: data.role as UserRole,
        grupoIds: data.grupoIds,
        ativo: data.ativo,
      };
      await onSubmit(user.id, dto);
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

  if (!user) return null;

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      title={t('editTitle')}
      description={t('editDescription')}
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
            value={user.email}
            disabled
            className="bg-gray-50"
          />
          <p className="text-xs text-gray-500">{t('emailReadonly')}</p>
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

        <div className="flex items-center gap-2">
          <Switch
            checked={watchedAtivo}
            onCheckedChange={(checked) => setValue('ativo', checked)}
          />
          <Label>{t('activeSwitch')}</Label>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            {tCommon('cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? tCommon('saving') : tCommon('saveChanges')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
