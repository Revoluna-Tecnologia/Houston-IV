import { Module } from '@nestjs/common'
import { EscalistasController } from './escalistas.controller'
import { EscalistasService } from './escalistas.service'
import { EscalistasRepository } from './escalistas.repository'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [EscalistasController],
  providers: [EscalistasService, EscalistasRepository],
  exports: [EscalistasService],
})
export class EscalistasModule {}
