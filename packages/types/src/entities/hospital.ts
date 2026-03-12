export interface Hospital {
  id: string;
  nome: string;
  cnpj: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  telefone: string | null;
  email: string | null;
  ativo: boolean;
  grupoId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateHospitalInput {
  nome: string;
  grupoId: string;
  cnpj?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  telefone?: string;
  email?: string;
}

export interface UpdateHospitalInput {
  nome?: string;
  grupoId?: string;
  cnpj?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  telefone?: string;
  email?: string;
  ativo?: boolean;
}
