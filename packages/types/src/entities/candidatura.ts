export type CandidaturaStatus = "pendente" | "aprovada" | "rejeitada";

export interface Candidatura {
  id: string;
  vagaId: string;
  medicoId: string;
  status: CandidaturaStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCandidaturaInput {
  vagaId: string;
  medicoId: string;
}

export interface UpdateCandidaturaInput {
  status?: CandidaturaStatus;
}
