import { Module } from '@nestjs/common'
import { CheckinCheckoutController } from './checkin-checkout.controller'
import { CheckinCheckoutService } from './checkin-checkout.service'
import { CheckinCheckoutRepository } from './checkin-checkout.repository'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [CheckinCheckoutController],
  providers: [CheckinCheckoutService, CheckinCheckoutRepository],
  exports: [CheckinCheckoutService],
})
export class CheckinCheckoutModule {}
