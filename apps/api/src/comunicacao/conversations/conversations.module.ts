import { Module } from '@nestjs/common'
import { ConversationsController } from './conversations.controller'
import { ConversationsService } from './conversations.service'
import { ConversationsRepository } from './conversations.repository'
import { ParticipantsRepository } from './participants.repository'
import { PrismaModule } from '../../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [ConversationsController],
  providers: [
    ConversationsService,
    ConversationsRepository,
    ParticipantsRepository,
  ],
  exports: [ConversationsService, ConversationsRepository, ParticipantsRepository],
})
export class ConversationsModule {}
