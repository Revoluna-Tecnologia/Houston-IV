import { Module } from '@nestjs/common'
import { KanbanController } from './kanban.controller'
import { KanbanService } from './kanban.service'
import { KanbanRepository } from './kanban.repository'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [KanbanController],
  providers: [KanbanService, KanbanRepository],
  exports: [KanbanService, KanbanRepository],
})
export class KanbanModule {}
