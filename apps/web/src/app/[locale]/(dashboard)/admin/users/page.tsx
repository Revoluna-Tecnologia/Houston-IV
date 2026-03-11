'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ConfirmDialog } from '@/components/houston';
import { useTableSort, usePagination } from '@/hooks';
import { useUsers } from '@/hooks/use-users';
import {
  UsersFilters,
  UsersFiltersValue,
  UsersTable,
  UserWithRelations,
  CreateUserModal,
  EditUserModal,
} from '@/components/admin/users';
import type { QueryParams } from '@/services/types';
import type { CreateUserDto, UpdateUserDto } from '@/services/users-service';

const PlusIcon = () => (
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
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const UsersIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-12 w-12"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const MOCK_GRUPOS = [
  { id: '1', nome: 'Grupo A' },
  { id: '2', nome: 'Grupo B' },
  { id: '3', nome: 'Grupo C' },
];

export default function AdminUsersPage() {
  const t = useTranslations('Admin.users');
  const tCommon = useTranslations('Common.actions');
  const [filters, setFilters] = useState<UsersFiltersValue>({
    role: 'all',
    grupoId: 'all',
    status: 'all',
    search: '',
  });

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRelations | null>(null);

  const { sorting, onSort } = useTableSort();
  const { page, pageSize, setPage } = usePagination();

  const queryParams: QueryParams = useMemo(() => {
    const params: QueryParams = {
      page,
      limit: pageSize,
    };

    if (sorting) {
      params.sortBy = sorting.id;
      params.sortOrder = sorting.direction ?? undefined;
    }

    if (filters.role !== 'all') {
      params.role = filters.role;
    }

    if (filters.grupoId !== 'all') {
      params.grupoId = filters.grupoId;
    }

    if (filters.status !== 'all') {
      params.ativo = filters.status === 'ativo';
    }

    if (filters.search) {
      params.search = filters.search;
    }

    return params;
  }, [filters, sorting, page, pageSize]);

  const { data: users, meta, isLoading, create, update, remove, activate, deactivate } = useUsers(queryParams);

  const usersWithRelations: UserWithRelations[] = useMemo(() => {
    return users.map((user) => {
      const gruposNomes = user.grupoIds
        .map((gId) => MOCK_GRUPOS.find((g) => g.id === gId)?.nome)
        .filter(Boolean) as string[];
      return {
        ...user,
        gruposNomes,
      };
    });
  }, [users]);

  const handleEdit = useCallback((user: UserWithRelations) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  }, []);

  const handleDelete = useCallback((user: UserWithRelations) => {
    setSelectedUser(user);
    setDeleteConfirmOpen(true);
  }, []);

  const handleActivate = useCallback(async (user: UserWithRelations) => {
    await activate(user.id);
  }, [activate]);

  const handleDeactivate = useCallback(async (user: UserWithRelations) => {
    await deactivate(user.id);
  }, [deactivate]);

  const handleCreateSubmit = useCallback(async (data: CreateUserDto) => {
    await create(data);
  }, [create]);

  const handleEditSubmit = useCallback(async (id: string, data: UpdateUserDto) => {
    await update(id, data);
  }, [update]);

  const handleDeleteConfirm = useCallback(async () => {
    if (selectedUser) {
      await remove(selectedUser.id);
      setDeleteConfirmOpen(false);
      setSelectedUser(null);
    }
  }, [selectedUser, remove]);

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <Button onClick={() => setCreateModalOpen(true)}>
          <PlusIcon />
          {t('newUser')}
        </Button>
      </div>

      <UsersFilters
        grupos={MOCK_GRUPOS}
        value={filters}
        onChange={setFilters}
        isLoading={isLoading}
      />

      {users.length === 0 ? (
        <EmptyState
          icon={<UsersIcon />}
          title={t('noUsers')}
          description={t('noUsersDescription')}
          action={{
            label: t('newUser'),
            onClick: () => setCreateModalOpen(true),
          }}
        />
      ) : (
        <UsersTable
          data={usersWithRelations}
          sorting={sorting}
          onSort={onSort}
          pageIndex={page - 1}
          pageSize={pageSize}
          totalCount={meta.total}
          onPageChange={(pageIndex) => setPage(pageIndex + 1)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onActivate={handleActivate}
          onDeactivate={handleDeactivate}
        />
      )}

      <CreateUserModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={handleCreateSubmit}
        grupos={MOCK_GRUPOS}
      />

      <EditUserModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        user={selectedUser}
        onSubmit={handleEditSubmit}
        grupos={MOCK_GRUPOS}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={t('deleteTitle')}
        description={t('deleteDescription')}
        confirmText={tCommon('delete')}
        cancelText={tCommon('cancel')}
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
