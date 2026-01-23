import { Module } from '@nestjs/common'
import { NotificationsController } from './notifications.controller'
import { NotificationsService } from './notifications.service'
import { NotificationsRepository } from './notifications.repository'
import { NotificationsGateway } from './notifications.gateway'
import { ResendProvider } from './providers/resend.provider'
import { NotificationEventListener } from './events/notification.listener'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsRepository,
    NotificationsGateway,
    ResendProvider,
    NotificationEventListener,
  ],
  exports: [NotificationsService, NotificationsGateway, ResendProvider],
})
export class NotificationsModule {}
