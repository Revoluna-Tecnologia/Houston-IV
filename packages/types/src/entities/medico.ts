export interface Medico {
  id: string
  primeiroNome: string
  sobrenome: string
  crm: string
  email?: string
  telefone?: string
  dataNascimento?: Date
  especialidadeId?: string
  rqe?: string
  cpf?: string
  rg?: string
  logradouro?: string
  numero?: string
  bairro?: string
  cidade?: string
  estado?: string
  pais: string
  cep?: string
  profilePictureUrl?: string
  grupoId?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateMedicoInput {
  primeiroNome: string
  sobrenome: string
  crm: string
  email?: string
  telefone?: string
  dataNascimento?: Date
  especialidadeId?: string
  rqe?: string
  cpf?: string
  rg?: string
  logradouro?: string
  numero?: string
  bairro?: string
  cidade?: string
  estado?: string
  pais?: string
  cep?: string
  grupoId?: string
}

export interface UpdateMedicoInput {
  primeiroNome?: string
  sobrenome?: string
  crm?: string
  email?: string
  telefone?: string
  dataNascimento?: Date
  especialidadeId?: string
  rqe?: string
  cpf?: string
  rg?: string
  logradouro?: string
  numero?: string
  bairro?: string
  cidade?: string
  estado?: string
  pais?: string
  cep?: string
  profilePictureUrl?: string
  grupoId?: string
}
