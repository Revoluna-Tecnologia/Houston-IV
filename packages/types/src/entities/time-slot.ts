export interface TimeSlot {
  id: string;
  gradeId: string;
  medicoId: string | null;
  data: Date;
  horaInicio: string;
  horaFim: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTimeSlotInput {
  gradeId: string;
  medicoId?: string;
  data: string;
  horaInicio: string;
  horaFim: string;
}

export interface UpdateTimeSlotInput {
  medicoId?: string | null;
  data?: string;
  horaInicio?: string;
  horaFim?: string;
}
