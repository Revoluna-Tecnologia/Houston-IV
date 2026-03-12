import { HttpStatus } from "@nestjs/common";
import { BusinessException } from "../business.exception";
import { EntityNotFoundException } from "../entity-not-found.exception";
import { StatusTransitionException } from "../status-transition.exception";
import { AccessDeniedException } from "../access-denied.exception";

describe("Custom Exceptions", () => {
  describe("BusinessException", () => {
    it("should create with default status 422", () => {
      const ex = new BusinessException(
        "Operação inválida",
        "INVALID_OPERATION",
      );
      expect(ex.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      const response = ex.getResponse() as any;
      expect(response.errorCode).toBe("INVALID_OPERATION");
      expect(response.message).toBe("Operação inválida");
    });

    it("should accept custom status code", () => {
      const ex = new BusinessException(
        "Conflict",
        "CONFLICT",
        HttpStatus.CONFLICT,
      );
      expect(ex.getStatus()).toBe(HttpStatus.CONFLICT);
    });
  });

  describe("EntityNotFoundException", () => {
    it("should format message with entity and id", () => {
      const ex = new EntityNotFoundException("Hospital", "abc-123");
      expect(ex.getStatus()).toBe(HttpStatus.NOT_FOUND);
      const response = ex.getResponse() as any;
      expect(response.message).toContain("Hospital");
      expect(response.message).toContain("abc-123");
      expect(response.errorCode).toBe("HOSPITAL_NOT_FOUND");
    });
  });

  describe("StatusTransitionException", () => {
    it("should format transition message", () => {
      const ex = new StatusTransitionException("Vaga", "aberta", "cancelada");
      expect(ex.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      const response = ex.getResponse() as any;
      expect(response.message).toContain("aberta");
      expect(response.message).toContain("cancelada");
      expect(response.errorCode).toBe("INVALID_STATUS_TRANSITION");
    });
  });

  describe("AccessDeniedException", () => {
    it("should format access denied message", () => {
      const ex = new AccessDeniedException("vagas", "deletar");
      expect(ex.getStatus()).toBe(HttpStatus.FORBIDDEN);
      const response = ex.getResponse() as any;
      expect(response.message).toContain("vagas");
      expect(response.message).toContain("deletar");
      expect(response.errorCode).toBe("ACCESS_DENIED");
    });
  });
});
