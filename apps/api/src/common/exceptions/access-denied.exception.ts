import { HttpException, HttpStatus } from "@nestjs/common";

export class AccessDeniedException extends HttpException {
  constructor(resource: string, action: string) {
    super(
      {
        message: `Acesso negado: não é possível ${action} em ${resource}`,
        errorCode: "ACCESS_DENIED",
        statusCode: HttpStatus.FORBIDDEN,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
