import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { WebhooksController } from './webhooks.controller'
import { WebhooksService } from './webhooks.service'
import { PrismaModule } from '../../prisma/prisma.module'
import { MessagesModule } from '../../comunicacao/messages/messages.module'
import { ConversationsModule } from '../../comunicacao/conversations/conversations.module'
import { InstancesModule } from '../instances/instances.module'

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    MessagesModule,
    ConversationsModule,
    InstancesModule,
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
