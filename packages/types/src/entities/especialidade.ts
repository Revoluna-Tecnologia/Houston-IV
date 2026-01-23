export interface Especialidade {
  id: string
  nome: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateEspecialidadeInput {
  nome: string
}

export interface UpdateEspecialidadeInput {
  nome?: string
}
