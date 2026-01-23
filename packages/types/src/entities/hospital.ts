export interface Hospital {
  id: string
  nome: string
  logradouro?: string
  numero?: string
  bairro?: string
  cidade?: string
  estado?: string
  pais: string
  cep?: string
  latitude?: number
  longitude?: number
  enderecoFormatado?: string
  avatar?: string
  grupoId?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateHospitalInput {
  nome: string
  logradouro?: string
  numero?: string
  bairro?: string
  cidade?: string
  estado?: string
  pais?: string
  cep?: string
  latitude?: number
  longitude?: number
  enderecoFormatado?: string
  grupoId?: string
}

export interface UpdateHospitalInput {
  nome?: string
  logradouro?: string
  numero?: string
  bairro?: string
  cidade?: string
  estado?: string
  pais?: string
  cep?: string
  latitude?: number
  longitude?: number
  enderecoFormatado?: string
  avatar?: string
  grupoId?: string
}
