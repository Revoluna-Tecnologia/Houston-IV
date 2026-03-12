export type EscalistaStatus = "pendente" | "ativo" | "inativo";

export interface Escalista {
  id: string;
  medicoId: string;
  grupoId: string;
  status: EscalistaStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEscalistaInput {
  medicoId: string;
  grupoId: string;
  status?: EscalistaStatus;
}

export interface UpdateEscalistaInput {
  status?: EscalistaStatus;
}
