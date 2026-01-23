import { Module } from '@nestjs/common'
import { InstancesController } from './instances.controller'
import { InstancesService } from './instances.service'
import { InstancesRepository } from './instances.repository'
import { PrismaModule } from '../../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [InstancesController],
  providers: [InstancesService, InstancesRepository],
  exports: [InstancesService, InstancesRepository],
})
export class InstancesModule {}
