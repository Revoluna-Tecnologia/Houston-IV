import type { Pagamento, PagamentoStatus } from "@prisma/client";
import { randomUUID } from "crypto";
import { Decimal } from "@prisma/client/runtime/client";

type PagamentoOverrides = Partial<Omit<Pagamento, "valor">> & {
  valor?: Decimal | number;
};

export const createPagamentoFixture = (
  overrides?: PagamentoOverrides,
): Pagamento => {
  const valor = overrides?.valor
    ? typeof overrides.valor === "number"
      ? new Decimal(overrides.valor)
      : overrides.valor
    : new Decimal(1500);

  return {
    id: randomUUID(),
    vagaId: randomUUID(),
    medicoId: randomUUID(),
    status: "pendente" as PagamentoStatus,
    dataAutorizacao: null,
    dataPagamento: null,
    observacoes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    deletedBy: null,
    ...overrides,
    valor,
  };
};

export const createAutorizadoPagamentoFixture = (
  overrides?: Partial<Pagamento>,
): Pagamento =>
  createPagamentoFixture({
    status: "autorizado" as PagamentoStatus,
    dataAutorizacao: new Date(),
    ...overrides,
  });

export const createPagoPagamentoFixture = (
  overrides?: Partial<Pagamento>,
): Pagamento =>
  createPagamentoFixture({
    status: "pago" as PagamentoStatus,
    dataAutorizacao: new Date(),
    dataPagamento: new Date(),
    ...overrides,
  });

export const createCanceladoPagamentoFixture = (
  overrides?: Partial<Pagamento>,
): Pagamento =>
  createPagamentoFixture({
    status: "cancelado" as PagamentoStatus,
    ...overrides,
  });

export const createPagamentoListFixture = (count: number): Pagamento[] =>
  Array.from({ length: count }, () => createPagamentoFixture());
