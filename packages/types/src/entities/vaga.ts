export type VagaStatus = 'aberta' | 'fechada' | 'cancelada' | 'anunciada'

export interface Vaga {
  id: string
  hospitalId: string
  data: Date
  periodoId: string
  horaInicio: string
  horaFim: string
  valor: number
  dataPagamento?: Date
  tiposVagaId: string
  observacoes?: string
  setorId: string
  status: VagaStatus
  totalCandidaturas: number
  especialidadeId: string
  grupoId: string
  escalistaId: string
  updatedBy: string
  updatedAt: Date
  createdAt: Date
}

export interface CreateVagaInput {
  hospitalId: string
  data: Date
  periodoId: string
  horaInicio: string
  horaFim: string
  valor: number
  dataPagamento?: Date
  tiposVagaId: string
  observacoes?: string
  setorId: string
  especialidadeId: string
  grupoId: string
  escalistaId: string
}

export interface UpdateVagaInput {
  hospitalId?: string
  data?: Date
  periodoId?: string
  horaInicio?: string
  horaFim?: string
  valor?: number
  dataPagamento?: Date
  tiposVagaId?: string
  observacoes?: string
  setorId?: string
  status?: VagaStatus
  especialidadeId?: string
  grupoId?: string
  escalistaId?: string
}
