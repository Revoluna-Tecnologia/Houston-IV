'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Modal, StatusBadge } from '@/components/houston';
import type { Medico, Especialidade, Escalista, Candidatura, CandidaturaStatus } from '../../services/types';

export interface MedicoDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medico: Medico | null;
  especialidade?: Especialidade | null;
  escalistas?: Escalista[];
  candidaturas?: Candidatura[];
  onEdit: () => void;
  onDelete: () => void;
}

const STATUS_LABELS: Record<CandidaturaStatus, string> = {
  pendente: 'Pendente',
  aprovada: 'Aprovada',
  rejeitada: 'Rejeitada',
};

export function MedicoDetailsModal({
  open,
  onOpenChange,
  medico,
  especialidade,
  escalistas = [],
  candidaturas = [],
  onEdit,
  onDelete,
}: MedicoDetailsModalProps) {
  if (!medico) return null;

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, 'dd/MM/yyyy', { locale: ptBR });
  };

  const formatCpf = (cpf: string | null) => {
    if (!cpf) return '-';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (phone: string | null) => {
    if (!phone) return '-';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Detalhes do Medico"
      size="lg"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{medico.nome}</h2>
            <p className="text-sm text-gray-500">
              CRM {medico.crm}/{medico.crmUf}
            </p>
          </div>
          <StatusBadge
            status={medico.ativo ? 'Ativo' : 'Inativo'}
            variant={medico.ativo ? 'success' : 'error'}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Nome Completo</p>
            <p className="font-medium">{medico.nome}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">CRM/UF</p>
            <p className="font-medium">{medico.crm}/{medico.crmUf}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">CPF</p>
            <p className="font-medium">{formatCpf(medico.cpf)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Especialidade</p>
            <p className="font-medium">{especialidade?.nome || '-'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium">{medico.email || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Telefone</p>
            <p className="font-medium">{formatPhone(medico.telefone)}</p>
          </div>
        </div>

        {escalistas.length > 0 && (
          <div>
            <p className="mb-2 text-sm text-gray-500">Grupos Vinculados ({escalistas.length})</p>
            <div className="space-y-2">
              {escalistas.map((escalista) => (
                <div
                  key={escalista.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <span className="text-sm">Grupo ID: {escalista.grupoId}</span>
                  <StatusBadge
                    status={escalista.status === 'ativo' ? 'Ativo' : escalista.status === 'pendente' ? 'Pendente' : 'Inativo'}
                    variant={escalista.status === 'ativo' ? 'success' : escalista.status === 'pendente' ? 'pending' : 'error'}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {candidaturas.length > 0 && (
          <div>
            <p className="mb-2 text-sm text-gray-500">Historico de Candidaturas ({candidaturas.length})</p>
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {candidaturas.map((candidatura) => (
                <div
                  key={candidatura.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <span className="text-sm">Vaga ID: {candidatura.vagaId}</span>
                    <p className="text-xs text-gray-500">{formatDate(candidatura.createdAt)}</p>
                  </div>
                  <StatusBadge
                    status={STATUS_LABELS[candidatura.status]}
                    variant={candidatura.status === 'aprovada' ? 'success' : candidatura.status === 'rejeitada' ? 'error' : 'pending'}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 border-t pt-4">
          <Button variant="destructive" onClick={onDelete}>
            Deletar
          </Button>
          <Button onClick={onEdit}>
            Editar
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
