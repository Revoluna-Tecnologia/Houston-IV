import type { Medico } from "../../generated/prisma/client";
import { randomUUID } from "crypto";

interface CreateMedicoFixtureParams {
  id?: string;
  nome?: string;
  crm?: string;
  crmUf?: string;
  cpf?: string | null;
  email?: string | null;
  telefone?: string | null;
  especialidadeId?: string;
  ativo?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  deletedBy?: string | null;
}

export const createMedicoFixture = (
  params?: CreateMedicoFixtureParams,
): Medico => ({
  id: params?.id ?? randomUUID(),
  nome: params?.nome ?? "Dr. Teste Silva",
  crm: params?.crm ?? "123456",
  crmUf: params?.crmUf ?? "SP",
  cpf: params?.cpf ?? "12345678901",
  email: params?.email ?? "medico@teste.com",
  telefone: params?.telefone ?? "11999999999",
  especialidadeId: params?.especialidadeId ?? randomUUID(),
  ativo: params?.ativo ?? true,
  createdAt: params?.createdAt ?? new Date(),
  updatedAt: params?.updatedAt ?? new Date(),
  deletedAt: params?.deletedAt ?? null,
  deletedBy: params?.deletedBy ?? null,
});

export const createInactiveMedicoFixture = (
  params?: CreateMedicoFixtureParams,
): Medico => createMedicoFixture({ ...params, ativo: false });

export const createMedicoListFixture = (
  count: number,
  especialidadeId?: string,
): Medico[] =>
  Array.from({ length: count }, (_, i) =>
    createMedicoFixture({
      nome: `Dr. Medico ${i + 1}`,
      crm: `${100000 + i}`,
      especialidadeId,
    }),
  );
