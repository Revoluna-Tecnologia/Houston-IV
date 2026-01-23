'use client';

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
import type { Escalista, EscalistaStatus } from '../../services/types';

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

const TrashIcon = () => (
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
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

export interface EscalistaWithRelations extends Escalista {
  medicoNome?: string;
  medicoCrm?: string;
  grupoNome?: string;
}

export interface EscalistasTableProps {
  data: EscalistaWithRelations[];
  sorting: SortingState | null;
  onSort: (sorting: SortingState | null) => void;
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (pageIndex: number) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onAtivar: (escalista: EscalistaWithRelations) => void;
  onInativar: (escalista: EscalistaWithRelations) => void;
  onRemove: (escalista: EscalistaWithRelations) => void;
}

const STATUS_LABELS: Record<EscalistaStatus, string> = {
  pendente: 'Pendente',
  ativo: 'Ativo',
  inativo: 'Inativo',
};

const STATUS_VARIANTS: Record<EscalistaStatus, StatusBadgeVariant> = {
  pendente: 'warning',
  ativo: 'success',
  inativo: 'error',
};

export function EscalistasTable({
  data,
  sorting,
  onSort,
  pageIndex,
  pageSize,
  totalCount,
  onPageChange,
  selectedIds,
  onSelectionChange,
  onAtivar,
  onInativar,
  onRemove,
}: EscalistasTableProps) {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(data.map((e) => e.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    }
  };

  const allSelected = data.length > 0 && selectedIds.length === data.length;
  const _someSelected = selectedIds.length > 0 && selectedIds.length < data.length;

  const columns: ColumnDef<EscalistaWithRelations>[] = [
    {
      id: 'select',
      header: () => (
        <Checkbox
          checked={allSelected}
          onCheckedChange={handleSelectAll}
          aria-label="Selecionar todos"
        />
      ),
      cell: (row) => (
        <Checkbox
          checked={selectedIds.includes(row.id)}
          onCheckedChange={(checked) => handleSelectOne(row.id, checked as boolean)}
          aria-label="Selecionar linha"
        />
      ),
      className: 'w-12',
    },
    {
      id: 'medico',
      header: 'Medico',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.medicoNome || '-'}</span>
          <span className="text-xs text-gray-500">CRM: {row.medicoCrm || '-'}</span>
        </div>
      ),
      sortable: true,
    },
    {
      id: 'grupo',
      header: 'Grupo',
      cell: (row) => row.grupoNome || '-',
      sortable: true,
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
            {row.status !== 'ativo' && (
              <DropdownMenuItem onClick={() => onAtivar(row)}>
                <CheckIcon />
                Ativar
              </DropdownMenuItem>
            )}
            {row.status !== 'inativo' && (
              <DropdownMenuItem onClick={() => onInativar(row)}>
                <XIcon />
                Inativar
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => onRemove(row)}
              className="text-red-600"
            >
              <TrashIcon />
              Remover
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
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
      emptyMessage="Nenhum escalista encontrado"
    />
  );
}
