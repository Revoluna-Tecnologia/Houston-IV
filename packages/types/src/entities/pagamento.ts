export type PagamentoStatus = "pendente" | "autorizado" | "pago" | "cancelado";

export interface Pagamento {
  id: string;
  vagaId: string;
  medicoId: string;
  valor: number;
  status: PagamentoStatus;
  dataAutorizacao: Date | null;
  dataPagamento: Date | null;
  observacoes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePagamentoInput {
  vagaId: string;
  medicoId: string;
  valor: number;
}

export interface UpdatePagamentoInput {
  valor?: number;
  status?: PagamentoStatus;
  observacoes?: string;
}
