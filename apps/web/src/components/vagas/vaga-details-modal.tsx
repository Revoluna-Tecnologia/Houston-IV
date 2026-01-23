'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Modal, StatusBadge, type StatusBadgeVariant } from '@/components/houston';
import type { Vaga, VagaStatus, Hospital, Candidatura } from '../../services/types';

export interface VagaDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vaga: Vaga | null;
  hospital?: Hospital | null;
  setorNome?: string;
  especialidadeNome?: string;
  candidaturas?: Candidatura[];
  onEdit: () => void;
  onCancel: () => void;
}

const STATUS_LABELS: Record<VagaStatus, string> = {
  aberta: 'Aberta',
  anunciada: 'Anunciada',
  fechada: 'Fechada',
  cancelada: 'Cancelada',
};

const STATUS_VARIANTS: Record<VagaStatus, StatusBadgeVariant> = {
  aberta: 'warning',
  anunciada: 'info',
  fechada: 'success',
  cancelada: 'error',
};

export function VagaDetailsModal({
  open,
  onOpenChange,
  vaga,
  hospital,
  setorNome,
  especialidadeNome,
  candidaturas = [],
  onEdit,
  onCancel,
}: VagaDetailsModalProps) {
  if (!vaga) return null;

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const canCancel = vaga.status === 'aberta' || vaga.status === 'anunciada';
  const canEdit = vaga.status !== 'cancelada' && vaga.status !== 'fechada';

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Detalhes da Vaga"
      size="lg"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <StatusBadge
            status={STATUS_LABELS[vaga.status]}
            variant={STATUS_VARIANTS[vaga.status]}
          />
          <span className="text-2xl font-semibold text-primary-600">
            {formatCurrency(vaga.valor || 0)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Data</p>
            <p className="font-medium">{formatDate(vaga.data)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Horario</p>
            <p className="font-medium">{vaga.horaInicio} - {vaga.horaFim}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Hospital</p>
            <p className="font-medium">{hospital?.nome || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Setor</p>
            <p className="font-medium">{setorNome || '-'}</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500">Especialidade</p>
          <p className="font-medium">{especialidadeNome || '-'}</p>
        </div>

        {vaga.observacoes && (
          <div>
            <p className="text-sm text-gray-500">Observacoes</p>
            <p className="mt-1 rounded-lg bg-gray-50 p-3 text-sm">{vaga.observacoes}</p>
          </div>
        )}

        {candidaturas.length > 0 && (
          <div>
            <p className="mb-2 text-sm text-gray-500">Candidaturas ({candidaturas.length})</p>
            <div className="space-y-2">
              {candidaturas.map((candidatura) => (
                <div
                  key={candidatura.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <span className="text-sm">Medico ID: {candidatura.medicoId}</span>
                  <StatusBadge
                    status={candidatura.status === 'aprovada' ? 'Aprovada' : candidatura.status === 'rejeitada' ? 'Rejeitada' : 'Pendente'}
                    variant={candidatura.status === 'aprovada' ? 'success' : candidatura.status === 'rejeitada' ? 'error' : 'pending'}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 border-t pt-4">
          {canCancel && (
            <Button variant="destructive" onClick={onCancel}>
              Cancelar Vaga
            </Button>
          )}
          {canEdit && (
            <Button onClick={onEdit}>
              Editar
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
