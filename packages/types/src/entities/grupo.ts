export interface Grupo {
  id: string
  nome: string
  responsavel?: string
  telefone?: string
  email?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateGrupoInput {
  nome: string
  responsavel?: string
  telefone?: string
  email?: string
}

export interface UpdateGrupoInput {
  nome?: string
  responsavel?: string
  telefone?: string
  email?: string
}
