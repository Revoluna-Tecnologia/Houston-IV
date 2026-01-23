import { Module } from '@nestjs/common'
import { MedicosController } from './medicos.controller'
import { MedicosService } from './medicos.service'
import { MedicosRepository } from './medicos.repository'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [MedicosController],
  providers: [MedicosService, MedicosRepository],
  exports: [MedicosService],
})
export class MedicosModule {}
