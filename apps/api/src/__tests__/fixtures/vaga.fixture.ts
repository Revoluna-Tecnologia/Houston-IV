import type { Vaga, VagaStatus } from "../../generated/prisma/client";
import { Decimal } from "@prisma/client/runtime/client";
import { randomUUID } from "crypto";

interface CreateVagaFixtureParams {
  id?: string;
  data?: Date;
  horaInicio?: string;
  horaFim?: string;
  valor?: Decimal | number;
  observacoes?: string | null;
  status?: VagaStatus;
  hospitalId?: string;
  setorId?: string;
  especialidadeId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  deletedBy?: string | null;
}

export const createVagaFixture = (params?: CreateVagaFixtureParams): Vaga => ({
  id: params?.id ?? randomUUID(),
  data: params?.data ?? new Date(),
  horaInicio: params?.horaInicio ?? "08:00",
  horaFim: params?.horaFim ?? "12:00",
  valor:
    params?.valor instanceof Decimal
      ? params.valor
      : new Decimal(params?.valor ?? 1500),
  observacoes: params?.observacoes ?? null,
  status: params?.status ?? "aberta",
  hospitalId: params?.hospitalId ?? randomUUID(),
  setorId: params?.setorId ?? randomUUID(),
  especialidadeId: params?.especialidadeId ?? randomUUID(),
  createdAt: params?.createdAt ?? new Date(),
  updatedAt: params?.updatedAt ?? new Date(),
  deletedAt: params?.deletedAt ?? null,
  deletedBy: params?.deletedBy ?? null,
});

export const createClosedVagaFixture = (
  params?: CreateVagaFixtureParams,
): Vaga => createVagaFixture({ ...params, status: "fechada" });

export const createAnnouncedVagaFixture = (
  params?: CreateVagaFixtureParams,
): Vaga => createVagaFixture({ ...params, status: "anunciada" });

export const createCancelledVagaFixture = (
  params?: CreateVagaFixtureParams,
): Vaga => createVagaFixture({ ...params, status: "cancelada" });

export const createVagaListFixture = (
  count: number,
  hospitalId?: string,
  setorId?: string,
): Vaga[] =>
  Array.from({ length: count }, (_, i) =>
    createVagaFixture({
      data: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
      hospitalId,
      setorId,
    }),
  );
