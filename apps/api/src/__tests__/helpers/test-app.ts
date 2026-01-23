import { Test, TestingModule } from '@nestjs/testing'
import {
  INestApplication,
  ValidationPipe,
  Type,
  DynamicModule,
  ForwardReference,
  Provider,
} from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from '../../prisma/prisma.module'
import { PrismaService } from '../../prisma/prisma.service'

type ImportType = Type | DynamicModule | Promise<DynamicModule> | ForwardReference

interface TestAppOptions {
  imports?: ImportType[]
  providers?: Provider[]
}

export async function createTestApp(options: TestAppOptions = {}): Promise<{
  app: INestApplication
  module: TestingModule
  prisma: PrismaService
}> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env.test',
      }),
      PrismaModule,
      ...(options.imports || []),
    ],
    providers: [...(options.providers || [])],
  }).compile()

  const app = moduleRef.createNestApplication()

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  )

  await app.init()

  const prisma = moduleRef.get(PrismaService)

  return {
    app,
    module: moduleRef,
    prisma,
  }
}

export async function closeTestApp(app: INestApplication): Promise<void> {
  await app.close()
}
