import type { Grupo } from "@prisma/client";
import { randomUUID } from "crypto";

interface CreateGrupoFixtureParams {
  id?: string;
  nome?: string;
  descricao?: string | null;
  ativo?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  deletedBy?: string | null;
}

export const createGrupoFixture = (
  params?: CreateGrupoFixtureParams,
): Grupo => ({
  id: params?.id ?? randomUUID(),
  nome: params?.nome ?? "Grupo Teste",
  descricao: params?.descricao ?? "Descricao do grupo teste",
  ativo: params?.ativo ?? true,
  createdAt: params?.createdAt ?? new Date(),
  updatedAt: params?.updatedAt ?? new Date(),
  deletedAt: params?.deletedAt ?? null,
  deletedBy: params?.deletedBy ?? null,
});

export const createInactiveGrupoFixture = (
  params?: CreateGrupoFixtureParams,
): Grupo => createGrupoFixture({ ...params, ativo: false });

export const createGrupoListFixture = (count: number): Grupo[] =>
  Array.from({ length: count }, (_, i) =>
    createGrupoFixture({ nome: `Grupo ${i + 1}` }),
  );
