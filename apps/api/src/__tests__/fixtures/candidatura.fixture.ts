import type {
  Candidatura,
  CandidaturaStatus,
} from "../../generated/prisma/client";
import { randomUUID } from "crypto";

interface CreateCandidaturaFixtureParams {
  id?: string;
  vagaId?: string;
  medicoId?: string;
  status?: CandidaturaStatus;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  deletedBy?: string | null;
}

export const createCandidaturaFixture = (
  params?: CreateCandidaturaFixtureParams,
): Candidatura => ({
  id: params?.id ?? randomUUID(),
  vagaId: params?.vagaId ?? randomUUID(),
  medicoId: params?.medicoId ?? randomUUID(),
  status: params?.status ?? "pendente",
  createdAt: params?.createdAt ?? new Date(),
  updatedAt: params?.updatedAt ?? new Date(),
  deletedAt: params?.deletedAt ?? null,
  deletedBy: params?.deletedBy ?? null,
});

export const createApprovedCandidaturaFixture = (
  params?: CreateCandidaturaFixtureParams,
): Candidatura => createCandidaturaFixture({ ...params, status: "aprovada" });

export const createRejectedCandidaturaFixture = (
  params?: CreateCandidaturaFixtureParams,
): Candidatura => createCandidaturaFixture({ ...params, status: "rejeitada" });

export const createCandidaturaListFixture = (
  count: number,
  vagaId?: string,
): Candidatura[] =>
  Array.from({ length: count }, () => createCandidaturaFixture({ vagaId }));
