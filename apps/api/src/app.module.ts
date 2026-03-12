import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { LoggerModule } from "nestjs-pino";
import { configValidationSchema } from "./config/config.validation";
import { CorrelationIdMiddleware } from "./common/middleware/correlation-id.middleware";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthModule } from "./health/health.module";
import { GruposModule } from "./grupos/grupos.module";
import { EspecialidadesModule } from "./especialidades/especialidades.module";
import { HospitaisModule } from "./hospitais/hospitais.module";
import { SetoresModule } from "./setores/setores.module";
import { MedicosModule } from "./medicos/medicos.module";
import { VagasModule } from "./vagas/vagas.module";
import { CandidaturasModule } from "./candidaturas/candidaturas.module";
import { EscalistasModule } from "./escalistas/escalistas.module";
import { GradesModule } from "./grades/grades.module";
import { RelatoriosModule } from "./relatorios/relatorios.module";
import { CheckinCheckoutModule } from "./checkin-checkout/checkin-checkout.module";
import { PagamentosModule } from "./pagamentos/pagamentos.module";
import { RbacModule } from "./auth/rbac/rbac.module";
import { TicketsModule } from "./tickets/tickets.module";
import { CommentsModule } from "./tickets/comments/comments.module";
import { AttachmentsModule } from "./tickets/attachments/attachments.module";
import { KanbanModule } from "./kanban/kanban.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { ComunicacaoModule } from "./comunicacao/comunicacao.module";
import { WhatsAppModule } from "./whatsapp/whatsapp.module";
import { StorageModule } from "./storage/storage.module";
import { MetricsModule } from "./metrics/metrics.module";
import { FeatureFlagsModule } from "./feature-flags/feature-flags.module";
import { AuditModule } from "./audit/audit.module";
import { AuthController } from "./auth/auth.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
      validationSchema: configValidationSchema,
      validationOptions: {
        abortEarly: false,
      },
    }),
    EventEmitterModule.forRoot(),
    // Rate Limiting - Proteção contra abuso
    ThrottlerModule.forRoot([
      {
        name: "short",
        ttl: 1000, // 1 segundo
        limit: 3, // 3 requisições por segundo
      },
      {
        name: "medium",
        ttl: 10000, // 10 segundos
        limit: 20, // 20 requisições a cada 10 segundos
      },
      {
        name: "long",
        ttl: 60000, // 1 minuto
        limit: 100, // 100 requisições por minuto
      },
    ]),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== "production"
            ? { target: "pino-pretty", options: { colorize: true } }
            : undefined,
        level: process.env.LOG_LEVEL || "info",
        autoLogging: true,
        redact: ["req.headers.authorization", "req.headers.cookie"],
        customProps: (req: any) => ({
          correlationId: req.headers["x-correlation-id"],
          userId: req.user?.id,
        }),
      },
    }),
    RbacModule,
    PrismaModule,
    HealthModule,
    GruposModule,
    EspecialidadesModule,
    HospitaisModule,
    SetoresModule,
    MedicosModule,
    VagasModule,
    CandidaturasModule,
    EscalistasModule,
    GradesModule,
    RelatoriosModule,
    CheckinCheckoutModule,
    PagamentosModule,
    TicketsModule,
    CommentsModule,
    AttachmentsModule,
    KanbanModule,
    NotificationsModule,
    ComunicacaoModule,
    WhatsAppModule.forRoot(),
    StorageModule,
    MetricsModule,
    FeatureFlagsModule,
    AuditModule,
  ],
  controllers: [AuthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes("*");
  }
}
