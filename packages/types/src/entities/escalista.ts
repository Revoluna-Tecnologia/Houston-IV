export type EscalistaStatus = 'pendente' | 'ativo' | 'inativo'

export interface Escalista {
  id: string
  nome: string
  telefone?: string
  email?: string
  grupoId?: string
  status: EscalistaStatus
  createdAt: Date
  updatedAt: Date
  updatedBy?: string
}

export interface CreateEscalistaInput {
  nome: string
  telefone?: string
  email?: string
  grupoId?: string
  status?: EscalistaStatus
}

export interface UpdateEscalistaInput {
  nome?: string
  telefone?: string
  email?: string
  grupoId?: string
  status?: EscalistaStatus
}
