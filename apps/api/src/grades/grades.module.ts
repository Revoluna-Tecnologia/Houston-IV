import { Module } from '@nestjs/common'
import { GradesController } from './grades.controller'
import { GradesService } from './grades.service'
import { GradesRepository } from './grades.repository'
import { PrismaModule } from '../prisma/prisma.module'
import { VagasModule } from '../vagas/vagas.module'
import { VagasRepository } from '../vagas/vagas.repository'

@Module({
  imports: [PrismaModule, VagasModule],
  controllers: [GradesController],
  providers: [GradesService, GradesRepository, VagasRepository],
  exports: [GradesService],
})
export class GradesModule {}
