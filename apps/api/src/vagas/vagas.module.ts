import { Module } from '@nestjs/common'
import { VagasController } from './vagas.controller'
import { VagasService } from './vagas.service'
import { VagasRepository } from './vagas.repository'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [VagasController],
  providers: [VagasService, VagasRepository],
  exports: [VagasService],
})
export class VagasModule {}
