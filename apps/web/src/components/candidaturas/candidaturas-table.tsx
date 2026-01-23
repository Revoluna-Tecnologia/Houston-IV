'use client';

import { useMemo, memo, useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  DataTable,
  StatusBadge,
  type ColumnDef,
  type SortingState,
  type StatusBadgeVariant,
} from '@/components/houston';
import type { Candidatura, CandidaturaStatus, Vaga, Medico, Hospital } from '../../services/types';

const MoreVerticalIcon = () => (
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
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="19" r="1" />
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

const EyeIcon = () => (
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
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export interface CandidaturaWithRelations extends Candidatura {
  vaga?: Vaga;
  medico?: Medico;
  hospital?: Hospital;
  hospitalNome?: string;
  setorNome?: string;
  medicoNome?: string;
  medicoCrm?: string;
}

export interface CandidaturasTableProps {
  data: CandidaturaWithRelations[];
  sorting: SortingState | null;
  onSort: (sorting: SortingState | null) => void;
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (pageIndex: number) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onAprovar: (candidatura: CandidaturaWithRelations) => void;
  onRejeitar: (candidatura: CandidaturaWithRelations) => void;
  onView: (candidatura: CandidaturaWithRelations) => void;
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

const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd/MM/yyyy', { locale: ptBR });
};

export const CandidaturasTable = memo(function CandidaturasTable({
  data,
  sorting,
  onSort,
  pageIndex,
  pageSize,
  totalCount,
  onPageChange,
  selectedIds,
  onSelectionChange,
  onAprovar,
  onRejeitar,
  onView,
}: CandidaturasTableProps) {
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      onSelectionChange(data.map((c) => c.id));
    } else {
      onSelectionChange([]);
    }
  }, [data, onSelectionChange]);

  const handleSelectRow = useCallback((id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
    }
  }, [selectedIds, onSelectionChange]);

  const allSelected = data.length > 0 && selectedIds.length === data.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < data.length;

  const columns = useMemo<ColumnDef<CandidaturaWithRelations>[]>(() => [
    {
      id: 'select',
      header: '',
      cell: (row) => (
        <Checkbox
          checked={selectedIds.includes(row.id)}
          onCheckedChange={(checked) => handleSelectRow(row.id, checked as boolean)}
        />
      ),
      className: 'w-12',
    },
    {
      id: 'data',
      header: 'Data',
      sortable: true,
      cell: (row) => formatDate(row.createdAt),
    },
    {
      id: 'vaga',
      header: 'Vaga',
      sortable: true,
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.hospitalNome || '-'}</span>
          <span className="text-sm text-gray-500">
            {row.setorNome || '-'} - {row.vaga?.horaInicio || '-'} - {row.vaga?.horaFim || '-'}
          </span>
        </div>
      ),
    },
    {
      id: 'medico',
      header: 'Medico',
      sortable: true,
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.medicoNome || '-'}</span>
          <span className="text-sm text-gray-500">{row.medicoCrm || '-'}</span>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => (
        <StatusBadge
          status={STATUS_LABELS[row.status]}
          variant={STATUS_VARIANTS[row.status]}
        />
      ),
    },
    {
      id: 'acoes',
      header: 'Acoes',
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVerticalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(row)}>
              <EyeIcon />
              Ver Detalhes
            </DropdownMenuItem>
            {row.status === 'pendente' && (
              <>
                <DropdownMenuItem onClick={() => onAprovar(row)}>
                  <CheckIcon />
                  Aprovar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onRejeitar(row)}
                  className="text-red-600"
                >
                  <XIcon />
                  Rejeitar
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [selectedIds, handleSelectRow, onView, onAprovar, onRejeitar]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Checkbox
          checked={allSelected}
          onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
          className={someSelected ? 'data-[state=checked]:bg-primary-300' : ''}
        />
        <span className="text-sm text-gray-500">Selecionar todos</span>
      </div>
      <DataTable
        columns={columns}
        data={data}
        sorting={sorting}
        onSort={onSort}
        pagination={{
          pageIndex,
          pageSize,
          totalCount,
        }}
        onPageChange={onPageChange}
        emptyMessage="Nenhuma candidatura encontrada"
      />
    </div>
  );
});
