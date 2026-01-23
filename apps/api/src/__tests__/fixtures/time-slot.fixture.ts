import type { TimeSlot } from '@prisma/client'
import { randomUUID } from 'crypto'

export const createTimeSlotFixture = (overrides?: Partial<TimeSlot>): TimeSlot => ({
  id: randomUUID(),
  gradeId: randomUUID(),
  medicoId: null,
  data: new Date('2025-01-15'),
  horaInicio: '08:00',
  horaFim: '12:00',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})
