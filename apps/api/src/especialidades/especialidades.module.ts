import { Module } from '@nestjs/common'
import { EspecialidadesController } from './especialidades.controller'
import { EspecialidadesService } from './especialidades.service'
import { EspecialidadesRepository } from './especialidades.repository'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [EspecialidadesController],
  providers: [EspecialidadesService, EspecialidadesRepository],
  exports: [EspecialidadesService],
})
export class EspecialidadesModule {}
