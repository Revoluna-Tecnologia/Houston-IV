export interface Setor {
  id: string
  nome: string
  hospitalId: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateSetorInput {
  nome: string
  hospitalId: string
}

export interface UpdateSetorInput {
  nome?: string
  hospitalId?: string
}
