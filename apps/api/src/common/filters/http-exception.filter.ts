import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Response, Request } from 'express'

interface ExceptionResponse {
  message: string | string[]
  error?: string
  statusCode?: number
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR

    const exceptionResponse =
      exception instanceof HttpException
        ? (exception.getResponse() as ExceptionResponse | string)
        : null

    let message: string | string[]
    let error: string | undefined

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse
    } else if (exceptionResponse) {
      message = exceptionResponse.message || 'Erro interno do servidor'
      error = exceptionResponse.error
    } else {
      message = 'Erro interno do servidor'
    }

    const correlationId = (request.headers['x-correlation-id'] as string) || this.generateCorrelationId()

    // Log the error with context
    const logContext = {
      correlationId,
      path: request.url,
      method: request.method,
      statusCode: status,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    }

    if (status >= 500) {
      this.logger.error(
        `Server error: ${Array.isArray(message) ? message.join(', ') : message}`,
        exception instanceof Error ? exception.stack : undefined,
        JSON.stringify(logContext)
      )
    } else if (status >= 400) {
      this.logger.warn(
        `Client error: ${Array.isArray(message) ? message.join(', ') : message}`,
        JSON.stringify(logContext)
      )
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      correlationId,
    })
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }
}
