'use client';

/**
 * AddContactForm Component
 * Formulario para adicionar novo contato
 * SRP: Responsavel apenas pelo formulario de adicao de contato
 */

import { useState, useCallback } from 'react';
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
import { cn } from '@/lib/utils';
import type { CreateContactDto } from '../../../services/comunicacao/types';

const COUNTRY_CODES = [
  { code: '+55', country: 'Brasil', flag: '🇧🇷' },
  { code: '+1', country: 'EUA/Canadá', flag: '🇺🇸' },
  { code: '+351', country: 'Portugal', flag: '🇵🇹' },
  { code: '+34', country: 'Espanha', flag: '🇪🇸' },
  { code: '+44', country: 'Reino Unido', flag: '🇬🇧' },
  { code: '+33', country: 'França', flag: '🇫🇷' },
  { code: '+49', country: 'Alemanha', flag: '🇩🇪' },
  { code: '+39', country: 'Itália', flag: '🇮🇹' },
  { code: '+81', country: 'Japão', flag: '🇯🇵' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
];

export interface AddContactFormProps {
  isSubmitting?: boolean;
  onSubmit: (data: CreateContactDto) => Promise<void>;
  onCancel: () => void;
  className?: string;
}

export function AddContactForm({
  isSubmitting = false,
  onSubmit,
  onCancel,
  className,
}: AddContactFormProps) {
  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState('+55');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatPhoneNumber = useCallback((value: string): string => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '');

    // Format as Brazilian phone (XX) XXXXX-XXXX
    if (digits.length <= 2) {
      return digits;
    }
    if (digits.length <= 7) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }
    if (digits.length <= 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }, []);

  const handlePhoneChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhoneNumber(e.target.value);
      setPhoneNumber(formatted);
      setErrors((prev) => ({ ...prev, phoneNumber: '' }));
    },
    [formatPhoneNumber]
  );

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setName(e.target.value);
      setErrors((prev) => ({ ...prev, name: '' }));
    },
    []
  );

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    const phoneDigits = phoneNumber.replace(/\D/g, '');
    if (!phoneDigits) {
      newErrors.phoneNumber = 'Telefone é obrigatório';
    } else if (countryCode === '+55' && phoneDigits.length !== 11) {
      newErrors.phoneNumber = 'Telefone brasileiro deve ter 11 dígitos (DDD + número)';
    } else if (phoneDigits.length < 8) {
      newErrors.phoneNumber = 'Telefone inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, phoneNumber, countryCode]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validate()) return;

      const phoneDigits = phoneNumber.replace(/\D/g, '');
      const fullPhone = `${countryCode}${phoneDigits}`;

      await onSubmit({
        name: name.trim(),
        phoneNumber: fullPhone,
      });
    },
    [name, phoneNumber, countryCode, validate, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="contact-name">Nome</Label>
        <Input
          id="contact-name"
          placeholder="Nome do contato"
          value={name}
          onChange={handleNameChange}
          disabled={isSubmitting}
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="contact-phone">Telefone</Label>
        <div className="flex gap-2">
          <Select
            value={countryCode}
            onValueChange={setCountryCode}
            disabled={isSubmitting}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRY_CODES.map(({ code, flag }) => (
                <SelectItem key={code} value={code}>
                  <span className="flex items-center gap-2">
                    <span>{flag}</span>
                    <span>{code}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            id="contact-phone"
            type="tel"
            placeholder="(11) 99999-9999"
            value={phoneNumber}
            onChange={handlePhoneChange}
            disabled={isSubmitting}
            className="flex-1"
            aria-invalid={!!errors.phoneNumber}
          />
        </div>
        {errors.phoneNumber && (
          <p className="text-sm text-destructive">{errors.phoneNumber}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Inclua o DDD do telefone
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar contato'}
        </Button>
      </div>
    </form>
  );
}
