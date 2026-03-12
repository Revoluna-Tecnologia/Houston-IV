export type VagaStatus = "aberta" | "fechada" | "cancelada" | "anunciada";

export interface Vaga {
  id: string;
  data: Date;
  horaInicio: string;
  horaFim: string;
  valor: number;
  observacoes: string | null;
  status: VagaStatus;
  hospitalId: string;
  setorId: string;
  especialidadeId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVagaInput {
  data: string;
  horaInicio: string;
  horaFim: string;
  valor: number;
  observacoes?: string;
  hospitalId: string;
  setorId: string;
  especialidadeId: string;
}

export interface UpdateVagaInput {
  data?: string;
  horaInicio?: string;
  horaFim?: string;
  valor?: number;
  observacoes?: string;
  hospitalId?: string;
  setorId?: string;
  especialidadeId?: string;
  status?: VagaStatus;
}
