'use client';

import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { useFormatCurrency } from '@/lib/format-currency';
import { useDateLocale } from '@/lib/date-locale';
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
import type { Pagamento, PagamentoStatus } from '@/services/types';

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

export interface PagamentoWithRelations extends Pagamento {
  medicoNome?: string;
  medicoCrm?: string;
  hospitalNome?: string;
  vagaData?: Date;
}

export interface PagamentosTableProps {
  data: PagamentoWithRelations[];
  sorting: SortingState | null;
  onSort: (sorting: SortingState | null) => void;
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (pageIndex: number) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onAutorizar: (pagamento: PagamentoWithRelations) => void;
  onPagar: (pagamento: PagamentoWithRelations) => void;
}

const STATUS_VARIANTS: Record<PagamentoStatus, StatusBadgeVariant> = {
  pendente: 'warning',
  autorizado: 'info',
  pago: 'success',
  cancelado: 'error',
};

export function PagamentosTable({
  data,
  sorting,
  onSort,
  pageIndex,
  pageSize,
  totalCount,
  onPageChange,
  selectedIds,
  onSelectionChange,
  onAutorizar,
  onPagar,
}: PagamentosTableProps) {
  const t = useTranslations('Pagamentos');
  const tCommon = useTranslations('Common.actions');
  const formatCurrency = useFormatCurrency();
  const dateLocale = useDateLocale();

  const STATUS_LABELS: Record<PagamentoStatus, string> = {
    pendente: t('status.pending'),
    autorizado: t('status.authorized'),
    pago: t('status.paid'),
    cancelado: t('status.cancelled'),
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, 'dd/MM/yyyy', { locale: dateLocale });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(data.map((p) => p.id));
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

  const columns: ColumnDef<PagamentoWithRelations>[] = [
    {
      id: 'select',
      header: () => (
        <Checkbox
          checked={allSelected}
          onCheckedChange={handleSelectAll}
          aria-label={t('table.selectAll')}
        />
      ),
      cell: (row) => (
        <Checkbox
          checked={selectedIds.includes(row.id)}
          onCheckedChange={(checked) => handleSelectOne(row.id, checked as boolean)}
          aria-label={t('table.selectRow')}
        />
      ),
      className: 'w-12',
    },
    {
      id: 'vaga',
      header: t('table.vaga'),
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.hospitalNome || '-'}</span>
          <span className="text-xs text-gray-500">{formatDate(row.vagaData ?? null)}</span>
        </div>
      ),
      sortable: true,
    },
    {
      id: 'medico',
      header: t('table.medico'),
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.medicoNome || '-'}</span>
          <span className="text-xs text-gray-500">CRM: {row.medicoCrm || '-'}</span>
        </div>
      ),
      sortable: true,
    },
    {
      id: 'valor',
      header: t('table.value'),
      accessorKey: 'valor',
      sortable: true,
      cell: (row) => (
        <span className="font-medium">{formatCurrency(row.valor)}</span>
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
      header: t('table.actions'),
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVerticalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {row.status === 'pendente' && (
              <DropdownMenuItem onClick={() => onAutorizar(row)}>
                <CheckIcon />
                {tCommon('authorize')}
              </DropdownMenuItem>
            )}
            {row.status === 'autorizado' && (
              <DropdownMenuItem onClick={() => onPagar(row)}>
                <DollarSignIcon />
                {tCommon('pay')}
              </DropdownMenuItem>
            )}
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
      emptyMessage={t('noPagamentos')}
    />
  );
}
