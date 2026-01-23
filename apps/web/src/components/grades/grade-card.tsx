'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge, type StatusBadgeVariant } from '@/components/houston';
import type { Grade, GradeStatus } from '../../services/types';

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

const SendIcon = () => (
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
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const ZapIcon = () => (
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
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
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

export interface GradeWithRelations extends Grade {
  hospitalNome?: string;
  setorNome?: string;
  slotsPreenchidos?: number;
  totalSlots?: number;
}

export interface GradeCardProps {
  grade: GradeWithRelations;
  onView: (grade: GradeWithRelations) => void;
  onEdit: (grade: GradeWithRelations) => void;
  onPublish: (grade: GradeWithRelations) => void;
  onGenerateVagas: (grade: GradeWithRelations) => void;
  onDelete: (grade: GradeWithRelations) => void;
}

const STATUS_LABELS: Record<GradeStatus, string> = {
  rascunho: 'Rascunho',
  publicada: 'Publicada',
  arquivada: 'Arquivada',
};

const STATUS_VARIANTS: Record<GradeStatus, StatusBadgeVariant> = {
  rascunho: 'warning',
  publicada: 'success',
  arquivada: 'pending',
};

const MESES = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function GradeCard({
  grade,
  onView,
  onEdit,
  onPublish,
  onGenerateVagas,
  onDelete,
}: GradeCardProps) {
  const progressPercentage = grade.totalSlots && grade.totalSlots > 0
    ? Math.round((grade.slotsPreenchidos || 0) / grade.totalSlots * 100)
    : 0;

  const periodoLabel = `${MESES[grade.mes - 1]} ${grade.ano}`;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg font-medium">{grade.nome}</CardTitle>
          <p className="text-sm text-gray-500">
            {grade.hospitalNome} - {grade.setorNome}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVerticalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(grade)}>
              <EyeIcon />
              Ver
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(grade)}>
              <EditIcon />
              Editar
            </DropdownMenuItem>
            {grade.status === 'rascunho' && (
              <DropdownMenuItem onClick={() => onPublish(grade)}>
                <SendIcon />
                Publicar
              </DropdownMenuItem>
            )}
            {grade.status === 'publicada' && (
              <DropdownMenuItem onClick={() => onGenerateVagas(grade)}>
                <ZapIcon />
                Gerar Vagas
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => onDelete(grade)}
              className="text-red-600"
            >
              <TrashIcon />
              Deletar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Periodo</span>
          <span className="text-sm font-medium">{periodoLabel}</span>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge
            status={STATUS_LABELS[grade.status]}
            variant={STATUS_VARIANTS[grade.status]}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Preenchimento</span>
            <span className="font-medium">
              {grade.slotsPreenchidos || 0} / {grade.totalSlots || 0} slots
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-xs text-gray-500 text-right">{progressPercentage}% preenchido</p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onView(grade)}
          >
            Ver Detalhes
          </Button>
          {grade.status === 'rascunho' && (
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onPublish(grade)}
            >
              Publicar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
