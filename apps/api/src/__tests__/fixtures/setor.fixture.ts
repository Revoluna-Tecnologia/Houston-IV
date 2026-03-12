import type { Setor } from "../../generated/prisma/client";
import { randomUUID } from "crypto";

interface CreateSetorFixtureParams {
  id?: string;
  nome?: string;
  descricao?: string | null;
  ativo?: boolean;
  hospitalId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  deletedBy?: string | null;
}

export const createSetorFixture = (
  params?: CreateSetorFixtureParams,
): Setor => ({
  id: params?.id ?? randomUUID(),
  nome: params?.nome ?? "UTI",
  descricao: params?.descricao ?? "Unidade de Terapia Intensiva",
  ativo: params?.ativo ?? true,
  hospitalId: params?.hospitalId ?? randomUUID(),
  createdAt: params?.createdAt ?? new Date(),
  updatedAt: params?.updatedAt ?? new Date(),
  deletedAt: params?.deletedAt ?? null,
  deletedBy: params?.deletedBy ?? null,
});

export const createInactiveSetorFixture = (
  params?: CreateSetorFixtureParams,
): Setor => createSetorFixture({ ...params, ativo: false });

export const createSetorListFixture = (
  count: number,
  hospitalId?: string,
): Setor[] =>
  Array.from({ length: count }, (_, i) =>
    createSetorFixture({ nome: `Setor ${i + 1}`, hospitalId }),
  );
