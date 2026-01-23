import { Module, forwardRef } from '@nestjs/common'
import { ShiftOffersController } from './shift-offers.controller'
import { ShiftOffersService } from './shift-offers.service'
import { ShiftOffersRepository } from './shift-offers.repository'
import { PrismaModule } from '../../prisma/prisma.module'
import { MessagesModule } from '../messages/messages.module'

@Module({
  imports: [PrismaModule, forwardRef(() => MessagesModule)],
  controllers: [ShiftOffersController],
  providers: [ShiftOffersService, ShiftOffersRepository],
  exports: [ShiftOffersService, ShiftOffersRepository],
})
export class ShiftOffersModule {}
