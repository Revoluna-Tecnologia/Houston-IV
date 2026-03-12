import type { Hospital } from "../../generated/prisma/client";
import { randomUUID } from "crypto";

interface CreateHospitalFixtureParams {
  id?: string;
  nome?: string;
  cnpj?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  telefone?: string | null;
  email?: string | null;
  ativo?: boolean;
  grupoId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  deletedBy?: string | null;
}

export const createHospitalFixture = (
  params?: CreateHospitalFixtureParams,
): Hospital => ({
  id: params?.id ?? randomUUID(),
  nome: params?.nome ?? "Hospital Teste",
  cnpj: params?.cnpj ?? "12345678000199",
  endereco: params?.endereco ?? "Rua Teste, 123",
  cidade: params?.cidade ?? "Sao Paulo",
  estado: params?.estado ?? "SP",
  cep: params?.cep ?? "01234567",
  telefone: params?.telefone ?? "11999999999",
  email: params?.email ?? "hospital@teste.com",
  ativo: params?.ativo ?? true,
  grupoId: params?.grupoId ?? randomUUID(),
  createdAt: params?.createdAt ?? new Date(),
  updatedAt: params?.updatedAt ?? new Date(),
  deletedAt: params?.deletedAt ?? null,
  deletedBy: params?.deletedBy ?? null,
});

export const createInactiveHospitalFixture = (
  params?: CreateHospitalFixtureParams,
): Hospital => createHospitalFixture({ ...params, ativo: false });

export const createHospitalListFixture = (
  count: number,
  grupoId?: string,
): Hospital[] =>
  Array.from({ length: count }, (_, i) =>
    createHospitalFixture({ nome: `Hospital ${i + 1}`, grupoId }),
  );
