import { Module } from '@nestjs/common'
import { SetoresController } from './setores.controller'
import { SetoresService } from './setores.service'
import { SetoresRepository } from './setores.repository'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [SetoresController],
  providers: [SetoresService, SetoresRepository],
  exports: [SetoresService],
})
export class SetoresModule {}
