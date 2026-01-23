'use client';

/**
 * ConnectionStatus Component
 * Badge que mostra status da conexao WhatsApp
 * SRP: Responsavel apenas pela UI do status de conexao
 */

import { cn } from '@/lib/utils';
import { WhatsAppInstanceStatus } from '../../../services/comunicacao/types';

const statusConfig: Record<
  WhatsAppInstanceStatus,
  { label: string; color: string; bgColor: string; dotColor: string }
> = {
  [WhatsAppInstanceStatus.CONNECTED]: {
    label: 'Conectado',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    dotColor: 'bg-green-500',
  },
  [WhatsAppInstanceStatus.DISCONNECTED]: {
    label: 'Desconectado',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    dotColor: 'bg-gray-500',
  },
  [WhatsAppInstanceStatus.CONNECTING]: {
    label: 'Conectando...',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    dotColor: 'bg-yellow-500',
  },
  [WhatsAppInstanceStatus.OFFLINE]: {
    label: 'Offline',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    dotColor: 'bg-red-500',
  },
};

export interface ConnectionStatusProps {
  status: WhatsAppInstanceStatus;
  phoneNumber?: string | null;
  showPhone?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ConnectionStatus({
  status,
  phoneNumber,
  showPhone = false,
  size = 'md',
  className,
}: ConnectionStatusProps) {
  const config = statusConfig[status];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  const dotSizes = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-2.5 w-2.5',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full font-medium',
        config.bgColor,
        config.color,
        sizeClasses[size],
        className
      )}
    >
      <span
        className={cn(
          'rounded-full',
          config.dotColor,
          dotSizes[size],
          status === WhatsAppInstanceStatus.CONNECTING && 'animate-pulse'
        )}
      />
      <span>{config.label}</span>
      {showPhone && phoneNumber && (
        <span className="opacity-70">({formatPhone(phoneNumber)})</span>
      )}
    </div>
  );
}

function formatPhone(phone: string): string {
  // Remove non-digits
  const digits = phone.replace(/\D/g, '');

  // Format as Brazilian phone
  if (digits.length === 13 && digits.startsWith('55')) {
    const ddd = digits.slice(2, 4);
    const part1 = digits.slice(4, 9);
    const part2 = digits.slice(9);
    return `(${ddd}) ${part1}-${part2}`;
  }

  if (digits.length === 11) {
    const ddd = digits.slice(0, 2);
    const part1 = digits.slice(2, 7);
    const part2 = digits.slice(7);
    return `(${ddd}) ${part1}-${part2}`;
  }

  return phone;
}
