export interface Medico {
  id: string;
  nome: string;
  crm: string;
  crmUf: string;
  cpf: string | null;
  email: string | null;
  telefone: string | null;
  especialidadeId: string;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMedicoInput {
  nome: string;
  crm: string;
  crmUf: string;
  especialidadeId: string;
  cpf?: string;
  email?: string;
  telefone?: string;
}

export interface UpdateMedicoInput {
  nome?: string;
  crm?: string;
  crmUf?: string;
  especialidadeId?: string;
  cpf?: string;
  email?: string;
  telefone?: string;
  ativo?: boolean;
}
