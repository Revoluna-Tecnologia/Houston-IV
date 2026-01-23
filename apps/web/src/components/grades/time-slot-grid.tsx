'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { TimeSlot } from '../../services/types';

export interface TimeSlotGridProps {
  slots: TimeSlot[];
  startDate: Date;
  endDate: Date;
  onSlotClick?: (slot: TimeSlot | null, date: Date, hora: string) => void;
  className?: string;
}

const HORAS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  '19:00', '20:00', '21:00', '22:00', '23:00', '00:00',
];

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

function getDaysInRange(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const current = new Date(start);
  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

function formatDate(date: Date): string {
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
}

export function TimeSlotGrid({
  slots,
  startDate,
  endDate,
  onSlotClick,
  className,
}: TimeSlotGridProps) {
  const days = useMemo(() => getDaysInRange(startDate, endDate), [startDate, endDate]);

  const slotMap = useMemo(() => {
    const map = new Map<string, TimeSlot>();
    slots.forEach((slot) => {
      const dateStr = new Date(slot.data).toISOString().split('T')[0];
      const key = `${dateStr}-${slot.horaInicio}`;
      map.set(key, slot);
    });
    return map;
  }, [slots]);

  const getSlotForCell = (date: Date, hora: string): TimeSlot | null => {
    const dateStr = date.toISOString().split('T')[0];
    const key = `${dateStr}-${hora}`;
    return slotMap.get(key) || null;
  };

  const handleCellClick = (date: Date, hora: string) => {
    if (onSlotClick) {
      const slot = getSlotForCell(date, hora);
      onSlotClick(slot, date, hora);
    }
  };

  return (
    <div className={cn('overflow-x-auto', className)}>
      <div className="min-w-[800px]">
        <div className="grid" style={{ gridTemplateColumns: `80px repeat(${days.length}, 1fr)` }}>
          <div className="h-12 border-b border-r bg-gray-50" />
          {days.map((day, idx) => (
            <div
              key={idx}
              className="h-12 border-b border-r bg-gray-50 flex flex-col items-center justify-center"
            >
              <span className="text-xs text-gray-500">{DIAS_SEMANA[day.getDay()]}</span>
              <span className="text-sm font-medium">{formatDate(day)}</span>
            </div>
          ))}

          {HORAS.map((hora) => (
            <>
              <div
                key={`hora-${hora}`}
                className="h-8 border-b border-r bg-gray-50 flex items-center justify-center"
              >
                <span className="text-xs text-gray-600">{hora}</span>
              </div>
              {days.map((day, dayIdx) => {
                const slot = getSlotForCell(day, hora);
                const hasSlot = !!slot;
                return (
                  <div
                    key={`${hora}-${dayIdx}`}
                    className={cn(
                      'h-8 border-b border-r cursor-pointer transition-colors',
                      hasSlot
                        ? 'bg-primary-100 hover:bg-primary-200'
                        : 'bg-white hover:bg-gray-50'
                    )}
                    onClick={() => handleCellClick(day, hora)}
                    title={hasSlot ? `Slot preenchido: ${hora}` : `Adicionar slot: ${hora}`}
                  >
                    {hasSlot && (
                      <div className="h-full w-full flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-primary-500" />
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
