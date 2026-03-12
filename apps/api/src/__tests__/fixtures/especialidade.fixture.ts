import type { Especialidade } from "@prisma/client";
import { randomUUID } from "crypto";

interface CreateEspecialidadeFixtureParams {
  id?: string;
  nome?: string;
  sigla?: string | null;
  cor?: string | null;
  ativo?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  deletedBy?: string | null;
}

export const createEspecialidadeFixture = (
  params?: CreateEspecialidadeFixtureParams,
): Especialidade => ({
  id: params?.id ?? randomUUID(),
  nome: params?.nome ?? "Cardiologia",
  sigla: params?.sigla ?? "CARD",
  cor: params?.cor ?? "#FF5733",
  ativo: params?.ativo ?? true,
  createdAt: params?.createdAt ?? new Date(),
  updatedAt: params?.updatedAt ?? new Date(),
  deletedAt: params?.deletedAt ?? null,
  deletedBy: params?.deletedBy ?? null,
});

export const createInactiveEspecialidadeFixture = (
  params?: CreateEspecialidadeFixtureParams,
): Especialidade => createEspecialidadeFixture({ ...params, ativo: false });

export const createEspecialidadeListFixture = (
  count: number,
): Especialidade[] =>
  Array.from({ length: count }, (_, i) =>
    createEspecialidadeFixture({
      nome: `Especialidade ${i + 1}`,
      sigla: `ESP${i + 1}`,
    }),
  );
