'use client';

import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { useFormatCurrency } from '@/lib/format-currency';
import { useDateLocale } from '@/lib/date-locale';
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
  type StatusBadgeVariant,
} from '@/components/houston';
import type { Vaga, VagaStatus, Hospital } from '../../services/types';

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

const EditIcon = () => (
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
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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

export interface VagaWithRelations extends Vaga {
  hospitalNome?: string;
  setorNome?: string;
}

export interface VagasTableProps {
  data: VagaWithRelations[];
  hospitals: Hospital[];
  sorting: SortingState | null;
  onSort: (sorting: SortingState | null) => void;
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (pageIndex: number) => void;
  onView: (vaga: VagaWithRelations) => void;
  onEdit: (vaga: VagaWithRelations) => void;
  onDelete: (vaga: VagaWithRelations) => void;
}

const STATUS_VARIANTS: Record<VagaStatus, StatusBadgeVariant> = {
  aberta: 'warning',
  anunciada: 'info',
  fechada: 'success',
  cancelada: 'error',
};

export function VagasTable({
  data,
  hospitals,
  sorting,
  onSort,
  pageIndex,
  pageSize,
  totalCount,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}: VagasTableProps) {
  const t = useTranslations('Vagas');
  const tActions = useTranslations('Common.actions');
  const formatCurrency = useFormatCurrency();
  const dateLocale = useDateLocale();

  const STATUS_LABELS: Record<VagaStatus, string> = {
    aberta: t('status.open'),
    anunciada: t('status.announced'),
    fechada: t('status.closed'),
    cancelada: t('status.cancelled'),
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, 'dd/MM/yyyy', { locale: dateLocale });
  };

  const getHospitalName = (hospitalId: string) => {
    const hospital = hospitals.find((h) => h.id === hospitalId);
    return hospital?.nome || '-';
  };

  const columns: ColumnDef<VagaWithRelations>[] = [
    {
      id: 'data',
      header: t('table.date'),
      accessorKey: 'data',
      sortable: true,
      cell: (row) => formatDate(row.data),
    },
    {
      id: 'hospital',
      header: t('table.hospital'),
      cell: (row) => row.hospitalNome || getHospitalName(row.hospitalId),
      sortable: true,
    },
    {
      id: 'setor',
      header: t('table.sector'),
      cell: (row) => row.setorNome || '-',
      sortable: true,
    },
    {
      id: 'horario',
      header: t('table.schedule'),
      cell: (row) => `${row.horaInicio} - ${row.horaFim}`,
    },
    {
      id: 'valor',
      header: t('table.value'),
      accessorKey: 'valor',
      sortable: true,
      cell: (row) => formatCurrency(row.valor || 0),
    },
    {
      id: 'status',
      header: t('table.status'),
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
              {tActions('view')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(row)}>
              <EditIcon />
              {tActions('edit')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(row)}
              className="text-red-600"
            >
              <TrashIcon />
              {tActions('delete')}
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
      emptyMessage={t('noVagas')}
    />
  );
}
