export type GradeStatus = "rascunho" | "publicada" | "encerrada";

export interface Grade {
  id: string;
  nome: string;
  descricao: string | null;
  dataInicio: Date;
  dataFim: Date;
  hospitalId: string;
  setorId: string;
  status: GradeStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGradeInput {
  nome: string;
  descricao?: string;
  dataInicio: string;
  dataFim: string;
  hospitalId: string;
  setorId: string;
}

export interface UpdateGradeInput {
  nome?: string;
  descricao?: string;
  dataInicio?: string;
  dataFim?: string;
  hospitalId?: string;
  setorId?: string;
  status?: GradeStatus;
}
