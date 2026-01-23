'use client';

import { Button } from '@/components/ui/button';
import { Modal, StatusBadge } from '@/components/houston';
import type { Hospital } from '../../services/types';

export interface HospitalDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hospital: Hospital | null;
  grupoNome?: string;
  onEdit: () => void;
}

export function HospitalDetailsModal({
  open,
  onOpenChange,
  hospital,
  grupoNome,
  onEdit,
}: HospitalDetailsModalProps) {
  if (!hospital) return null;

  const formatCnpj = (cnpj: string | null) => {
    if (!cnpj) return '-';
    const numbers = cnpj.replace(/\D/g, '');
    return numbers.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  const formatCep = (cep: string | null) => {
    if (!cep) return '-';
    const numbers = cep.replace(/\D/g, '');
    return numbers.replace(/^(\d{5})(\d{3})$/, '$1-$2');
  };

  const formatTelefone = (telefone: string | null) => {
    if (!telefone) return '-';
    const numbers = telefone.replace(/\D/g, '');
    if (numbers.length === 10) {
      return numbers.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
    }
    return numbers.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={hospital.nome}
      size="lg"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <StatusBadge
            status={hospital.ativo ? 'Ativo' : 'Inativo'}
            variant={hospital.ativo ? 'success' : 'error'}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Grupo</p>
            <p className="text-sm">{grupoNome || '-'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">CNPJ</p>
            <p className="text-sm">{formatCnpj(hospital.cnpj)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Email</p>
            <p className="text-sm">{hospital.email || '-'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Telefone</p>
            <p className="text-sm">{formatTelefone(hospital.telefone)}</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-500">Endereco</p>
          <p className="text-sm">{hospital.endereco || '-'}</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">CEP</p>
            <p className="text-sm">{formatCep(hospital.cep)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Cidade</p>
            <p className="text-sm">{hospital.cidade || '-'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Estado</p>
            <p className="text-sm">{hospital.estado || '-'}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={onEdit}>
            Editar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
