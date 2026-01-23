'use client';

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
import type { User, UserRole } from '../../../services/types';

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

export interface UserWithRelations extends User {
  gruposNomes?: string[];
}

export interface UsersTableProps {
  data: UserWithRelations[];
  sorting: SortingState | null;
  onSort: (sorting: SortingState | null) => void;
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (pageIndex: number) => void;
  onEdit: (user: UserWithRelations) => void;
  onDelete: (user: UserWithRelations) => void;
  onActivate: (user: UserWithRelations) => void;
  onDeactivate: (user: UserWithRelations) => void;
}

const ROLE_LABELS: Record<UserRole, string> = {
  administrador: 'Administrador',
  moderador: 'Moderador',
  gestor: 'Gestor',
  coordenador: 'Coordenador',
  escalista: 'Escalista',
};

export function UsersTable({
  data,
  sorting,
  onSort,
  pageIndex,
  pageSize,
  totalCount,
  onPageChange,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
}: UsersTableProps) {
  const columns: ColumnDef<UserWithRelations>[] = [
    {
      id: 'name',
      header: 'Nome',
      accessorKey: 'name',
      sortable: true,
    },
    {
      id: 'email',
      header: 'Email',
      accessorKey: 'email',
      sortable: true,
    },
    {
      id: 'role',
      header: 'Funcao',
      accessorKey: 'role',
      sortable: true,
      cell: (row) => (
        <span className="px-2 py-1 rounded-full text-xs bg-primary-100 text-primary-700">
          {ROLE_LABELS[row.role]}
        </span>
      ),
    },
    {
      id: 'grupos',
      header: 'Grupos',
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.gruposNomes && row.gruposNomes.length > 0 ? (
            row.gruposNomes.map((nome, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
              >
                {nome}
              </span>
            ))
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'ativo',
      sortable: true,
      cell: (row) => (
        <StatusBadge
          status={row.ativo ? 'Ativo' : 'Inativo'}
          variant={row.ativo ? 'success' : 'error'}
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
            <DropdownMenuItem onClick={() => onEdit(row)}>
              <EditIcon />
              Editar
            </DropdownMenuItem>
            {row.ativo ? (
              <DropdownMenuItem onClick={() => onDeactivate(row)}>
                <XIcon />
                Desativar
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onActivate(row)}>
                <CheckIcon />
                Ativar
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => onDelete(row)}
              className="text-red-600"
            >
              <TrashIcon />
              Deletar
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
      emptyMessage="Nenhum usuario encontrado"
    />
  );
}
