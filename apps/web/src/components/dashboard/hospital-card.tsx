'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useFormatCurrency } from '@/lib/format-currency';
import type { Hospital, Vaga } from '../../services/types';

const BuildingIcon = () => (
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
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <path d="M9 22v-4h6v4" />
    <path d="M8 6h.01" />
    <path d="M16 6h.01" />
    <path d="M12 6h.01" />
    <path d="M12 10h.01" />
    <path d="M12 14h.01" />
    <path d="M16 10h.01" />
    <path d="M16 14h.01" />
    <path d="M8 10h.01" />
    <path d="M8 14h.01" />
  </svg>
);

export interface HospitalCardProps {
  hospital: Hospital;
  vagas: Vaga[];
  onClick?: () => void;
  className?: string;
}

export function HospitalCard({ hospital, vagas, onClick, className }: HospitalCardProps) {
  const formatCurrency = useFormatCurrency();
  const vagasAbertas = vagas.filter((v) => v.status === 'aberta' || v.status === 'anunciada').length;
  const vagasFechadas = vagas.filter((v) => v.status === 'fechada').length;
  const valorTotal = vagas.reduce((acc, v) => acc + (v.valor || 0), 0);

  return (
    <Card
      className={cn(
        'cursor-pointer transition-shadow hover:shadow-md',
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary-50 p-2 text-primary-500">
            <BuildingIcon />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{hospital.nome}</CardTitle>
            {hospital.cidade && hospital.estado && (
              <p className="text-sm text-gray-500">
                {hospital.cidade}, {hospital.estado}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-semibold text-yellow-600">{vagasAbertas}</p>
            <p className="text-xs text-gray-500">Abertas</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-green-600">{vagasFechadas}</p>
            <p className="text-xs text-gray-500">Fechadas</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(valorTotal)}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
