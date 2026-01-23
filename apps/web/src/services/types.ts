export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  grupoIds: string[];
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMINISTRADOR = 'administrador',
  MODERADOR = 'moderador',
  GESTOR = 'gestor',
  COORDENADOR = 'coordenador',
  ESCALISTA = 'escalista',
}


export interface Grupo {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Especialidade {
  id: string;
  nome: string;
  sigla: string | null;
  cor: string | null;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Hospital {
  id: string;
  nome: string;
  grupoId: string;
  cnpj: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  telefone: string | null;
  email: string | null;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Setor {
  id: string;
  nome: string;
  hospitalId: string;
  descricao: string | null;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Medico {
  id: string;
  nome: string;
  crm: string;
  crmUf: string;
  especialidadeId: string;
  cpf: string | null;
  email: string | null;
  telefone: string | null;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum VagaStatus {
  ABERTA = 'aberta',
  ANUNCIADA = 'anunciada',
  FECHADA = 'fechada',
  CANCELADA = 'cancelada',
}

export interface Vaga {
  id: string;
  data: Date;
  horaInicio: string;
  horaFim: string;
  valor: number;
  observacoes: string | null;
  status: VagaStatus;
  hospitalId: string;
  setorId: string;
  especialidadeId: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum CandidaturaStatus {
  PENDENTE = 'pendente',
  APROVADA = 'aprovada',
  REJEITADA = 'rejeitada',
}

export interface Candidatura {
  id: string;
  vagaId: string;
  medicoId: string;
  status: CandidaturaStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum EscalistaStatus {
  PENDENTE = 'pendente',
  ATIVO = 'ativo',
  INATIVO = 'inativo',
}

export interface Escalista {
  id: string;
  medicoId: string;
  grupoId: string;
  status: EscalistaStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Grade {
  id: string;
  nome: string;
  hospitalId: string;
  setorId: string;
  mes: number;
  ano: number;
  status: GradeStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum GradeStatus {
  RASCUNHO = 'rascunho',
  PUBLICADA = 'publicada',
  ARQUIVADA = 'arquivada',
}

export interface TimeSlot {
  id: string;
  gradeId: string;
  data: Date;
  horaInicio: string;
  horaFim: string;
  especialidadeId: string;
  valor: number;
}

export enum PagamentoStatus {
  PENDENTE = 'pendente',
  AUTORIZADO = 'autorizado',
  PAGO = 'pago',
  CANCELADO = 'cancelado',
}

export interface Pagamento {
  id: string;
  vagaId: string;
  medicoId: string;
  valor: number;
  status: PagamentoStatus;
  dataAutorizacao: Date | null;
  dataPagamento: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: unknown;
}

export interface CreateVagaDto {
  data: string;
  horaInicio: string;
  horaFim: string;
  valor: number;
  observacoes?: string;
  hospitalId: string;
  setorId: string;
  especialidadeId: string;
}

export interface UpdateVagaDto extends Partial<CreateVagaDto> {}

export interface CreateCandidaturaDto {
  vagaId: string;
  medicoId: string;
}

export interface CreateMedicoDto {
  nome: string;
  crm: string;
  crmUf: string;
  especialidadeId: string;
  cpf?: string;
  email?: string;
  telefone?: string;
}

export interface UpdateMedicoDto extends Partial<CreateMedicoDto> {}

export interface CreateHospitalDto {
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

export interface UpdateHospitalDto extends Partial<CreateHospitalDto> {}

export interface CreateGradeDto {
  nome: string;
  hospitalId: string;
  setorId: string;
  mes: number;
  ano: number;
}

export interface UpdateGradeDto extends Partial<CreateGradeDto> {}

export interface CreateTimeSlotDto {
  data: string;
  horaInicio: string;
  horaFim: string;
  especialidadeId: string;
  valor: number;
}

export interface CreatePagamentoDto {
  vagaId: string;
  medicoId: string;
  valor: number;
}

export interface UpdatePagamentoDto {
  valor?: number;
  status?: PagamentoStatus;
}

export interface BulkOperationResult {
  success: string[];
  failed: string[];
}


export interface RelatorioFiltros {
  dataInicio?: string;
  dataFim?: string;
  hospitalId?: string;
  setorId?: string;
  especialidadeId?: string;
  medicoId?: string;
  grupoId?: string;
  mes?: number;
  ano?: number;
}

export interface FolhaPagamentoItem {
  medicoId: string;
  medicoNome: string;
  medicoCrm: string;
  totalVagas: number;
  totalHoras: number;
  valorTotal: number;
  valorPago: number;
  valorPendente: number;
  vagas: FolhaPagamentoVaga[];
}

export interface FolhaPagamentoVaga {
  vagaId: string;
  data: Date;
  horaInicio: string;
  horaFim: string;
  valor: number;
  hospitalNome: string;
  setorNome: string;
  status: PagamentoStatus;
}

export interface GradeRelatorio {
  gradeId: string;
  gradeNome: string;
  hospitalId: string;
  hospitalNome: string;
  setorId: string;
  setorNome: string;
  mes: number;
  ano: number;
  status: GradeStatus;
  totalSlots: number;
  slotsPreenchidos: number;
  slotsVazios: number;
  percentualPreenchimento: number;
  valorTotal: number;
}

export interface ProdutividadeItem {
  medicoId: string;
  medicoNome: string;
  medicoCrm: string;
  totalVagas: number;
  totalHoras: number;
  vagasAprovadas: number;
  vagasRejeitadas: number;
  vagasCanceladas: number;
  taxaAprovacao: number;
  valorTotal: number;
}

export interface FiltrosDisponiveis {
  hospitais: { id: string; nome: string }[];
  setores: { id: string; nome: string; hospitalId: string }[];
  especialidades: { id: string; nome: string }[];
  medicos: { id: string; nome: string }[];
  grupos: { id: string; nome: string }[];
  periodos: { mes: number; ano: number }[];
}
