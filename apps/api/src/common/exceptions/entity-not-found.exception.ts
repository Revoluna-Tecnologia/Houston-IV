import { HttpException, HttpStatus } from "@nestjs/common";

export class EntityNotFoundException extends HttpException {
  constructor(entity: string, id: string) {
    super(
      {
        message: `${entity} com id '${id}' não encontrado(a)`,
        errorCode: `${entity.toUpperCase()}_NOT_FOUND`,
        statusCode: HttpStatus.NOT_FOUND,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
