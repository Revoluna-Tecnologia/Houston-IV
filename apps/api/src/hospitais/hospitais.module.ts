import { Module } from '@nestjs/common'
import { HospitaisController } from './hospitais.controller'
import { HospitaisService } from './hospitais.service'
import { HospitaisRepository } from './hospitais.repository'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [HospitaisController],
  providers: [HospitaisService, HospitaisRepository],
  exports: [HospitaisService],
})
export class HospitaisModule {}
