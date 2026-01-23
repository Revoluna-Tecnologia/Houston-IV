import { Module } from '@nestjs/common'
import { CandidaturasController } from './candidaturas.controller'
import { CandidaturasService } from './candidaturas.service'
import { CandidaturasRepository } from './candidaturas.repository'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [CandidaturasController],
  providers: [CandidaturasService, CandidaturasRepository],
  exports: [CandidaturasService],
})
export class CandidaturasModule {}
