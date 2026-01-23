import { Module } from '@nestjs/common'
import { AttachmentsController } from './attachments.controller'
import { AttachmentsService } from './attachments.service'
import { AttachmentsRepository } from './attachments.repository'
import { PrismaModule } from '../../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [AttachmentsController],
  providers: [AttachmentsService, AttachmentsRepository],
  exports: [AttachmentsService, AttachmentsRepository],
})
export class AttachmentsModule {}
