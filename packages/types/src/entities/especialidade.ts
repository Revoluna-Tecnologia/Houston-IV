export interface Especialidade {
  id: string;
  nome: string;
  sigla: string | null;
  cor: string | null;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEspecialidadeInput {
  nome: string;
  sigla?: string;
  cor?: string;
}

export interface UpdateEspecialidadeInput {
  nome?: string;
  sigla?: string;
  cor?: string;
  ativo?: boolean;
}
