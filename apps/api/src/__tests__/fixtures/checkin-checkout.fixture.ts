import type { CheckinCheckout } from "../../generated/prisma/client";
import { randomUUID } from "crypto";

export const createCheckinCheckoutFixture = (
  overrides?: Partial<CheckinCheckout>,
): CheckinCheckout => ({
  id: randomUUID(),
  vagaId: randomUUID(),
  medicoId: randomUUID(),
  checkinAt: null,
  checkoutAt: null,
  observacoes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  deletedBy: null,
  ...overrides,
});

export const createCheckinCheckoutWithCheckinFixture = (
  overrides?: Partial<CheckinCheckout>,
): CheckinCheckout =>
  createCheckinCheckoutFixture({ ...overrides, checkinAt: new Date() });

export const createCheckinCheckoutWithCheckoutFixture = (
  overrides?: Partial<CheckinCheckout>,
): CheckinCheckout =>
  createCheckinCheckoutFixture({
    ...overrides,
    checkinAt: new Date(),
    checkoutAt: new Date(),
  });

export const createCheckinCheckoutListFixture = (
  count: number,
): CheckinCheckout[] =>
  Array.from({ length: count }, () => createCheckinCheckoutFixture());
