export interface Setor {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  hospitalId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSetorInput {
  nome: string;
  hospitalId: string;
  descricao?: string;
}

export interface UpdateSetorInput {
  nome?: string;
  hospitalId?: string;
  descricao?: string;
  ativo?: boolean;
}
