import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap, catchError } from 'rxjs/operators'
import { PrismaService } from '../../prisma/prisma.service'
import { AuditAction, Prisma } from '@prisma/client'

export interface AuditLogEntry {
  userId: string
  userEmail: string
  action: AuditAction
  resource: string
  resourceId?: string
  oldValue?: Prisma.InputJsonValue
  newValue?: Prisma.InputJsonValue
  ipAddress?: string
  userAgent?: string
  correlationId?: string
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name)

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest()
    const { method, url, user, ip, headers, body } = request

    // Ignorar GET requests - não são ações de modificação
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      return next.handle()
    }

    const action = this.methodToAction(method)
    if (!action) {
      return next.handle()
    }

    const resource = this.extractResource(url)
    const resourceId = this.extractResourceId(url)
    const correlationId = headers['x-correlation-id'] || headers['x-request-id']
    const userAgent = headers['user-agent']

    // Capturar o valor antigo antes da modificação (para UPDATE e DELETE)
    const oldValue: Prisma.InputJsonValue | undefined = method === 'PUT' || method === 'PATCH' || method === 'DELETE'
      ? { requestBody: body } as Prisma.InputJsonValue
      : undefined

    return next.handle().pipe(
      tap(async (response) => {
        // Só loga se o usuário estiver autenticado
        if (!user?.id || !user?.email) {
          return
        }

        try {
          await this.logAuditEntry({
            userId: user.id,
            userEmail: user.email,
            action,
            resource,
            resourceId: this.extractIdFromResponse(response) || resourceId,
            oldValue,
            newValue: this.sanitizeResponse(response),
            ipAddress: ip,
            userAgent,
            correlationId,
          })
        } catch (error) {
          // Log de erro mas não falha a requisição
          this.logger.error('Failed to log audit entry', error)
        }
      }),
      catchError((error) => {
        // Não loga erros de autenticação/autorização
        throw error
      })
    )
  }

  private methodToAction(method: string): AuditAction | null {
    const actionMap: Record<string, AuditAction> = {
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    }
    return actionMap[method] || null
  }

  private extractResource(url: string): string {
    // Remove prefixo /api e extrai o primeiro segmento
    // Ex: /api/vagas/123 -> vagas
    const cleanUrl = url.replace(/^\/api\//, '').replace(/^\//, '')
    const segments = cleanUrl.split('/')
    return segments[0] || 'unknown'
  }

  private extractResourceId(url: string): string | undefined {
    // Extrai UUID do URL se existir
    const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
    const match = url.match(uuidPattern)
    return match?.[0]
  }

  private extractIdFromResponse(response: unknown): string | undefined {
    if (response && typeof response === 'object' && 'id' in response) {
      return String((response as Record<string, unknown>).id)
    }
    return undefined
  }

  private sanitizeResponse(response: unknown): Prisma.InputJsonValue | undefined {
    if (!response || typeof response !== 'object') {
      return undefined
    }

    // Remove campos sensíveis
    const sanitized = { ...response as Record<string, unknown> }
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'hash']

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]'
      }
    }

    return sanitized as Prisma.InputJsonValue
  }

  private async logAuditEntry(entry: AuditLogEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: entry.userId,
        userEmail: entry.userEmail,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        oldValue: entry.oldValue ?? undefined,
        newValue: entry.newValue ?? undefined,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        correlationId: entry.correlationId,
      },
    })

    this.logger.log({
      msg: 'Audit log created',
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      userId: entry.userId,
    })
  }
}
