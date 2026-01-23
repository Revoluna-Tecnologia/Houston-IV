'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { StatusBadge, type StatusBadgeVariant } from '@/components/houston';
import type { Candidatura, CandidaturaStatus, Vaga, Medico, Hospital } from '../../services/types';

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

const XIcon = () => (
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
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export interface CandidaturaRowData extends Candidatura {
  vaga?: Vaga;
  medico?: Medico;
  hospital?: Hospital;
  hospitalNome?: string;
  setorNome?: string;
  medicoNome?: string;
  medicoCrm?: string;
}

export interface CandidaturaRowProps {
  candidatura: CandidaturaRowData;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onAprovar: () => void;
  onRejeitar: () => void;
  onView: () => void;
}

const STATUS_LABELS: Record<CandidaturaStatus, string> = {
  pendente: 'Pendente',
  aprovada: 'Aprovada',
  rejeitada: 'Rejeitada',
};

const STATUS_VARIANTS: Record<CandidaturaStatus, StatusBadgeVariant> = {
  pendente: 'pending',
  aprovada: 'success',
  rejeitada: 'error',
};

export function CandidaturaRow({
  candidatura,
  isSelected,
  onSelect,
  onAprovar,
  onRejeitar,
  onView,
}: CandidaturaRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, 'dd/MM/yyyy', { locale: ptBR });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const isPendente = candidatura.status === 'pendente';

  return (
    <div className="rounded-lg border bg-background">
      <div className="flex items-center gap-4 p-4">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(checked as boolean)}
        />

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </Button>

        <div className="flex-1 grid grid-cols-4 gap-4">
          <div>
            <span className="text-sm text-gray-500">Data</span>
            <p className="font-medium">{formatDate(candidatura.createdAt)}</p>
          </div>

          <div>
            <span className="text-sm text-gray-500">Vaga</span>
            <p className="font-medium">{candidatura.hospitalNome || '-'}</p>
            <p className="text-sm text-gray-500">
              {candidatura.setorNome || '-'} - {candidatura.vaga?.horaInicio || '-'} - {candidatura.vaga?.horaFim || '-'}
            </p>
          </div>

          <div>
            <span className="text-sm text-gray-500">Medico</span>
            <p className="font-medium">{candidatura.medicoNome || '-'}</p>
            <p className="text-sm text-gray-500">{candidatura.medicoCrm || '-'}</p>
          </div>

          <div className="flex items-center justify-between">
            <StatusBadge
              status={STATUS_LABELS[candidatura.status]}
              variant={STATUS_VARIANTS[candidatura.status]}
            />

            <div className="flex items-center gap-2">
              {isPendente && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onAprovar}
                    className="text-green-600 border-green-600 hover:bg-green-50"
                  >
                    <CheckIcon />
                    Aprovar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRejeitar}
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <XIcon />
                    Rejeitar
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={onView}>
                Ver
              </Button>
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t bg-gray-50 p-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Valor da Vaga</p>
              <p className="font-medium">{candidatura.vaga ? formatCurrency(candidatura.vaga.valor) : '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Data da Vaga</p>
              <p className="font-medium">{candidatura.vaga ? formatDate(candidatura.vaga.data) : '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Candidatura Enviada</p>
              <p className="font-medium">{formatDate(candidatura.createdAt)}</p>
            </div>
          </div>

          {candidatura.medico && (
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Email do Medico</p>
                <p className="font-medium">{candidatura.medico.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Telefone do Medico</p>
                <p className="font-medium">{candidatura.medico.telefone || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">CRM/UF</p>
                <p className="font-medium">{candidatura.medico.crm}/{candidatura.medico.crmUf}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
