'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
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
} from '@/components/houston';
import type { Medico, Especialidade } from '../../services/types';

const MoreVerticalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
  </svg>
);

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

export interface MedicoWithRelations extends Medico {
  especialidadeNome?: string;
}

export interface MedicosTableProps {
  data: MedicoWithRelations[];
  especialidades: Especialidade[];
  sorting: SortingState | null;
  onSort: (sorting: SortingState | null) => void;
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (pageIndex: number) => void;
  onView: (medico: MedicoWithRelations) => void;
  onEdit: (medico: MedicoWithRelations) => void;
  onDelete: (medico: MedicoWithRelations) => void;
}

export function MedicosTable({
  data,
  especialidades,
  sorting,
  onSort,
  pageIndex,
  pageSize,
  totalCount,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}: MedicosTableProps) {
  const t = useTranslations('Medicos');
  const tCommon = useTranslations('Common');

  const getEspecialidadeNome = (especialidadeId: string) => {
    const especialidade = especialidades.find((e) => e.id === especialidadeId);
    return especialidade?.nome || '-';
  };

  const columns: ColumnDef<MedicoWithRelations>[] = [
    {
      id: 'nome',
      header: t('table.name'),
      accessorKey: 'nome',
      sortable: true,
      cell: (row) => (
        <span className="font-medium">{row.nome}</span>
      ),
    },
    {
      id: 'crm',
      header: 'CRM',
      sortable: true,
      cell: (row) => `${row.crm}/${row.crmUf}`,
    },
    {
      id: 'especialidade',
      header: t('table.specialty'),
      sortable: true,
      cell: (row) => row.especialidadeNome || getEspecialidadeNome(row.especialidadeId),
    },
    {
      id: 'email',
      header: tCommon('labels.email'),
      accessorKey: 'email',
      cell: (row) => row.email || '-',
    },
    {
      id: 'telefone',
      header: t('table.phone'),
      accessorKey: 'telefone',
      cell: (row) => row.telefone || '-',
    },
    {
      id: 'status',
      header: tCommon('labels.status'),
      accessorKey: 'ativo',
      sortable: true,
      cell: (row) => (
        <StatusBadge
          status={row.ativo ? tCommon('status.active') : tCommon('status.inactive')}
          variant={row.ativo ? 'success' : 'error'}
        />
      ),
    },
    {
      id: 'acoes',
      header: t('table.actions'),
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
              {tCommon('actions.view')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(row)}>
              <EditIcon />
              {tCommon('actions.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(row)} className="text-red-600">
              <TrashIcon />
              {tCommon('actions.delete')}
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
      pagination={{ pageIndex, pageSize, totalCount }}
      onPageChange={onPageChange}
      emptyMessage={t('noMedicos')}
    />
  );
}
