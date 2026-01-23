'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Modal } from '@/components/houston';
import type { Grade } from '../../services/types';

const ZapIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

export interface GenerateVagasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grade: Grade | null;
  especialidades: { id: string; nome: string }[];
  onConfirm: (especialidadeId: string, valor: number) => Promise<void>;
}

export function GenerateVagasModal({
  open,
  onOpenChange,
  grade,
  especialidades,
  onConfirm,
}: GenerateVagasModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [especialidadeId, setEspecialidadeId] = useState('');
  const [valor, setValor] = useState(0);

  const handleConfirm = async () => {
    if (!especialidadeId || valor <= 0) return;
    setIsSubmitting(true);
    try {
      await onConfirm(especialidadeId, valor);
      setEspecialidadeId('');
      setValor(0);
    } catch {
      // Error handled by onConfirm callback
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEspecialidadeId('');
    setValor(0);
    onOpenChange(false);
  };

  if (!grade) return null;

  const slotsCount = 100;

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      title="Gerar Vagas"
      description="Configure os parametros para gerar vagas a partir dos time slots da grade"
      size="md"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4 rounded-lg bg-blue-50 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <ZapIcon />
          </div>
          <div>
            <p className="text-sm font-medium">Resumo da Geracao</p>
            <p className="text-sm text-gray-600">
              {slotsCount} time slots serao convertidos em {slotsCount} vagas
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="especialidade">Especialidade</Label>
            <Select
              value={especialidadeId}
              onValueChange={setEspecialidadeId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a especialidade" />
              </SelectTrigger>
              <SelectContent>
                {especialidades.map((esp) => (
                  <SelectItem key={esp.id} value={esp.id}>
                    {esp.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor">Valor por Vaga (R$)</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              min="0"
              value={valor}
              onChange={(e) => setValor(parseFloat(e.target.value) || 0)}
              placeholder="0,00"
            />
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <h4 className="text-sm font-medium mb-2">Valor Total Estimado</h4>
          <p className="text-2xl font-semibold text-primary-600">
            {(slotsCount * valor).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {slotsCount} vagas x {valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting || !especialidadeId || valor <= 0}
          >
            {isSubmitting ? 'Gerando...' : 'Gerar Vagas'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
