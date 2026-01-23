'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { StatusBadge, type StatusBadgeVariant } from '@/components/houston';
import type { Pagamento, PagamentoStatus } from '../../services/types';

const ChevronDownIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ChevronUpIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
  >
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const DollarSignIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
  >
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

export interface PagamentoRowData extends Pagamento {
  medicoNome?: string;
  medicoCrm?: string;
  hospitalNome?: string;
  setorNome?: string;
  vagaData?: Date;
  horaInicio?: string;
  horaFim?: string;
}

export interface PagamentoRowProps {
  pagamento: PagamentoRowData;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onAutorizar: () => void;
  onPagar: () => void;
}

const STATUS_LABELS: Record<PagamentoStatus, string> = {
  pendente: 'Pendente',
  autorizado: 'Autorizado',
  pago: 'Pago',
  cancelado: 'Cancelado',
};

const STATUS_VARIANTS: Record<PagamentoStatus, StatusBadgeVariant> = {
  pendente: 'warning',
  autorizado: 'info',
  pago: 'success',
  cancelado: 'error',
};

export function PagamentoRow({
  pagamento,
  isSelected,
  onSelect,
  onAutorizar,
  onPagar,
}: PagamentoRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, 'dd/MM/yyyy', { locale: ptBR });
  };

  const formatDateTime = (date: Date | string | null | undefined) => {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, "dd/MM/yyyy 'as' HH:mm", { locale: ptBR });
  };

  return (
    <>
      <TableRow className={isSelected ? 'bg-primary-50' : undefined}>
        <TableCell className="w-12">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            aria-label="Selecionar pagamento"
          />
        </TableCell>
        <TableCell>
          <div className="flex flex-col">
            <span className="font-medium">{pagamento.hospitalNome || '-'}</span>
            <span className="text-xs text-gray-500">{formatDate(pagamento.vagaData)}</span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-col">
            <span className="font-medium">{pagamento.medicoNome || '-'}</span>
            <span className="text-xs text-gray-500">CRM: {pagamento.medicoCrm || '-'}</span>
          </div>
        </TableCell>
        <TableCell>
          <span className="font-medium">{formatCurrency(pagamento.valor)}</span>
        </TableCell>
        <TableCell>
          <StatusBadge
            status={STATUS_LABELS[pagamento.status]}
            variant={STATUS_VARIANTS[pagamento.status]}
          />
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {pagamento.status === 'pendente' && (
              <Button size="sm" variant="outline" onClick={onAutorizar}>
                <CheckIcon />
                Autorizar
              </Button>
            )}
            {pagamento.status === 'autorizado' && (
              <Button size="sm" onClick={onPagar}>
                <DollarSignIcon />
                Pagar
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow className="bg-gray-50">
          <TableCell colSpan={6}>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Hospital</p>
                  <p className="text-sm">{pagamento.hospitalNome || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Setor</p>
                  <p className="text-sm">{pagamento.setorNome || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Data da Vaga</p>
                  <p className="text-sm">{formatDate(pagamento.vagaData)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Horario</p>
                  <p className="text-sm">
                    {pagamento.horaInicio || '-'} - {pagamento.horaFim || '-'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Medico</p>
                  <p className="text-sm">{pagamento.medicoNome || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">CRM</p>
                  <p className="text-sm">{pagamento.medicoCrm || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Valor</p>
                  <p className="text-sm font-semibold">{formatCurrency(pagamento.valor)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <StatusBadge
                    status={STATUS_LABELS[pagamento.status]}
                    variant={STATUS_VARIANTS[pagamento.status]}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <p className="text-sm font-medium text-gray-500">Data de Autorizacao</p>
                  <p className="text-sm">{formatDateTime(pagamento.dataAutorizacao)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Data de Pagamento</p>
                  <p className="text-sm">{formatDateTime(pagamento.dataPagamento)}</p>
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
