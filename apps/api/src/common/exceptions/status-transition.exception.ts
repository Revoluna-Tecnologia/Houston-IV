import { HttpException, HttpStatus } from "@nestjs/common";

export class StatusTransitionException extends HttpException {
  constructor(entity: string, from: string, to: string) {
    super(
      {
        message: `Transição de status inválida para ${entity}: '${from}' → '${to}'`,
        errorCode: "INVALID_STATUS_TRANSITION",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
