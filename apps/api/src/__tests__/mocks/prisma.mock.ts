import { PrismaClient } from "../../generated/prisma/client";
import { mockDeep, DeepMockProxy } from "vitest-mock-extended";

export type MockPrismaClient = DeepMockProxy<PrismaClient>;

export const createMockPrisma = (): MockPrismaClient => {
  return mockDeep<PrismaClient>();
};
