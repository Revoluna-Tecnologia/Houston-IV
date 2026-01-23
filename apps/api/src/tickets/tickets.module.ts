import { Module } from '@nestjs/common'
import { TicketsController } from './tickets.controller'
import { TicketsService } from './tickets.service'
import { TicketsRepository } from './tickets.repository'
import { PrismaModule } from '../prisma/prisma.module'
import { AnalyticsModule } from './analytics/analytics.module'

@Module({
  imports: [PrismaModule, AnalyticsModule],
  controllers: [TicketsController],
  providers: [TicketsService, TicketsRepository],
  exports: [TicketsService, TicketsRepository],
})
export class TicketsModule {}
