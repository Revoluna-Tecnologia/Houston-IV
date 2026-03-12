export interface Grupo {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGrupoInput {
  nome: string;
  descricao?: string;
}

export interface UpdateGrupoInput {
  nome?: string;
  descricao?: string;
  ativo?: boolean;
}
