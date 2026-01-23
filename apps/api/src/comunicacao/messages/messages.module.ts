import { Module } from '@nestjs/common'
import { MessagesController } from './messages.controller'
import { MessagesService } from './messages.service'
import { MessagesRepository } from './messages.repository'
import { MessagesGateway } from './messages.gateway'
import { PrismaModule } from '../../prisma/prisma.module'
import { ConversationsModule } from '../conversations/conversations.module'

@Module({
  imports: [PrismaModule, ConversationsModule],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesRepository, MessagesGateway],
  exports: [MessagesService, MessagesRepository, MessagesGateway],
})
export class MessagesModule {}
