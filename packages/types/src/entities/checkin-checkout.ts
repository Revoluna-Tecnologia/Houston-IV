export interface CheckinCheckout {
  id: string;
  vagaId: string;
  medicoId: string;
  checkinAt: Date | null;
  checkoutAt: Date | null;
  observacoes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCheckinCheckoutInput {
  vagaId: string;
  medicoId: string;
  checkinAt?: string;
}

export interface UpdateCheckinCheckoutInput {
  checkinAt?: string;
  checkoutAt?: string;
  observacoes?: string;
}
