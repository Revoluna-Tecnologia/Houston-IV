import { Module } from '@nestjs/common'
import { PagamentosController } from './pagamentos.controller'
import { PagamentosService } from './pagamentos.service'
import { PagamentosRepository } from './pagamentos.repository'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [PagamentosController],
  providers: [PagamentosService, PagamentosRepository],
  exports: [PagamentosService],
})
export class PagamentosModule {}
