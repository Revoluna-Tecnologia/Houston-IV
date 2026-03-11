'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataTable, StatusBadge, type ColumnDef, type SortingState } from '@/components/houston';
import type { Hospital } from '../../services/types';

const MoreVerticalIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>);
const EyeIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>);
const EditIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>);
const TrashIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>);
const LayoutListIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /><path d="M14 4h7" /><path d="M14 9h7" /><path d="M14 15h7" /><path d="M14 20h7" /></svg>);

export interface HospitalWithRelations extends Hospital { grupoNome?: string; }

export interface HospitaisTableProps {
  data: HospitalWithRelations[]; sorting: SortingState | null; onSort: (sorting: SortingState | null) => void;
  pageIndex: number; pageSize: number; totalCount: number; onPageChange: (pageIndex: number) => void;
  onView: (hospital: HospitalWithRelations) => void; onEdit: (hospital: HospitalWithRelations) => void;
  onDelete: (hospital: HospitalWithRelations) => void; onViewSetores: (hospital: HospitalWithRelations) => void;
}

export function HospitaisTable({ data, sorting, onSort, pageIndex, pageSize, totalCount, onPageChange, onView, onEdit, onDelete, onViewSetores }: HospitaisTableProps) {
  const t = useTranslations('Hospitais.table');
  const tCommon = useTranslations('Common');

  const formatCnpj = (cnpj: string | null) => {
    if (!cnpj) return '-';
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  const columns: ColumnDef<HospitalWithRelations>[] = [
    { id: 'nome', header: t('name'), accessorKey: 'nome', sortable: true },
    { id: 'cnpj', header: 'CNPJ', cell: (row) => formatCnpj(row.cnpj), sortable: true },
    { id: 'cidade', header: t('city'), accessorKey: 'cidade', sortable: true, cell: (row) => row.cidade || '-' },
    { id: 'estado', header: t('state'), accessorKey: 'estado', sortable: true, cell: (row) => row.estado || '-' },
    { id: 'grupo', header: t('group'), cell: (row) => row.grupoNome || '-', sortable: true },
    { id: 'status', header: tCommon('labels.status'), accessorKey: 'ativo', sortable: true, cell: (row) => (<StatusBadge status={row.ativo ? tCommon('status.active') : tCommon('status.inactive')} variant={row.ativo ? 'success' : 'error'} />) },
    { id: 'acoes', header: t('actions'), cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVerticalIcon /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(row)}><EyeIcon />{tCommon('actions.view')}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(row)}><EditIcon />{tCommon('actions.edit')}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewSetores(row)}><LayoutListIcon />{t('viewSectors')}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(row)} className="text-red-600"><TrashIcon />{tCommon('actions.delete')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return <DataTable columns={columns} data={data} sorting={sorting} onSort={onSort} pagination={{ pageIndex, pageSize, totalCount }} onPageChange={onPageChange} emptyMessage={useTranslations('Hospitais')('noHospitais')} />;
}
