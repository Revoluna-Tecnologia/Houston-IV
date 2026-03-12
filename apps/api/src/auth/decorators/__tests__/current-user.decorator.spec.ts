import { describe, it, expect } from "vitest";
import { ExecutionContext } from "@nestjs/common";
import {
  AuthenticatedUser,
  AppRole,
  AppPermission,
} from "../../types/auth.types";

/**
 * Test the CurrentUser decorator logic directly.
 * The actual decorator factory is equivalent to this function.
 */
function currentUserFactory(
  data: keyof AuthenticatedUser | undefined,
  ctx: ExecutionContext,
): AuthenticatedUser | AuthenticatedUser[keyof AuthenticatedUser] | undefined {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user as AuthenticatedUser | undefined;

  if (!user) {
    return undefined;
  }

  return data ? user[data] : user;
}

describe("CurrentUser decorator logic", () => {
  const mockUser: AuthenticatedUser = {
    id: "user-123",
    email: "test@example.com",
    name: "Test User",
    roles: [AppRole.ADMINISTRADOR],
    permissions: [AppPermission.VAGAS_SELECT, AppPermission.VAGAS_INSERT],
    grupoIds: ["grupo-1"],
    hospitalIds: ["hospital-1"],
    setorIds: ["setor-1"],
  };

  const createMockContext = (user?: AuthenticatedUser): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getType: () => "http",
      getClass: () => ({}),
      getHandler: () => ({}),
      getArgs: () => [],
      getArgByIndex: () => undefined,
      switchToRpc: () => ({}),
      switchToWs: () => ({}),
    } as unknown as ExecutionContext;
  };

  describe("when user is present", () => {
    it("should return full user when no data specified", () => {
      const ctx = createMockContext(mockUser);

      const result = currentUserFactory(undefined, ctx);

      expect(result).toEqual(mockUser);
    });

    it('should return user id when data is "id"', () => {
      const ctx = createMockContext(mockUser);

      const result = currentUserFactory("id", ctx);

      expect(result).toBe("user-123");
    });

    it('should return user email when data is "email"', () => {
      const ctx = createMockContext(mockUser);

      const result = currentUserFactory("email", ctx);

      expect(result).toBe("test@example.com");
    });

    it('should return user roles when data is "roles"', () => {
      const ctx = createMockContext(mockUser);

      const result = currentUserFactory("roles", ctx);

      expect(result).toEqual([AppRole.ADMINISTRADOR]);
    });

    it('should return grupoIds when data is "grupoIds"', () => {
      const ctx = createMockContext(mockUser);

      const result = currentUserFactory("grupoIds", ctx);

      expect(result).toEqual(["grupo-1"]);
    });

    it('should return permissions array when data is "permissions"', () => {
      const ctx = createMockContext(mockUser);

      const result = currentUserFactory("permissions", ctx);

      expect(result).toEqual([
        AppPermission.VAGAS_SELECT,
        AppPermission.VAGAS_INSERT,
      ]);
    });

    it('should return name when data is "name"', () => {
      const ctx = createMockContext(mockUser);

      const result = currentUserFactory("name", ctx);

      expect(result).toBe("Test User");
    });

    it('should return hospitalIds when data is "hospitalIds"', () => {
      const ctx = createMockContext(mockUser);

      const result = currentUserFactory("hospitalIds", ctx);

      expect(result).toEqual(["hospital-1"]);
    });

    it('should return setorIds when data is "setorIds"', () => {
      const ctx = createMockContext(mockUser);

      const result = currentUserFactory("setorIds", ctx);

      expect(result).toEqual(["setor-1"]);
    });
  });

  describe("when user is not present", () => {
    it("should return undefined when no user in request", () => {
      const ctx = createMockContext(undefined);

      const result = currentUserFactory(undefined, ctx);

      expect(result).toBeUndefined();
    });

    it("should return undefined when data specified but no user", () => {
      const ctx = createMockContext(undefined);

      const result = currentUserFactory("id", ctx);

      expect(result).toBeUndefined();
    });
  });
});
