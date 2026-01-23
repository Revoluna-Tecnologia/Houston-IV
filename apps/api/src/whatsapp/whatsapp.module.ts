/**
 * WhatsApp Module
 * Módulo principal de integração WhatsApp
 * Implementa Strategy Pattern para suporte multi-provider
 */

import { Module, DynamicModule, Provider, Logger } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { HttpModule } from '@nestjs/axios'
import { WhatsAppService } from './whatsapp.service'
import { WHATSAPP_PROVIDER } from './providers/whatsapp-provider.interface'
import { ZapsterProvider } from './providers/zapster.provider'
import { TwilioProvider } from './providers/twilio.provider'
import { MetaProvider } from './providers/meta.provider'
import { InstancesModule } from './instances/instances.module'
import { WhatsAppProvider } from './types'
import { PrismaModule } from '../prisma/prisma.module'

const logger = new Logger('WhatsAppModule')

/**
 * Factory para criar o provider correto baseado na ENV
 */
const whatsAppProviderFactory: Provider = {
  provide: WHATSAPP_PROVIDER,
  useFactory: (
    configService: ConfigService,
    zapsterProvider: ZapsterProvider,
    twilioProvider: TwilioProvider,
    metaProvider: MetaProvider
  ) => {
    const providerName = configService.get<string>(
      'WHATSAPP_PROVIDER',
      WhatsAppProvider.ZAPSTER
    )

    logger.log(`Initializing WhatsApp provider: ${providerName}`)

    switch (providerName) {
      case WhatsAppProvider.TWILIO:
        return twilioProvider
      case WhatsAppProvider.META:
        return metaProvider
      case WhatsAppProvider.ZAPSTER:
      default:
        return zapsterProvider
    }
  },
  inject: [ConfigService, ZapsterProvider, TwilioProvider, MetaProvider],
}

@Module({})
export class WhatsAppModule {
  /**
   * Registra o módulo com o provider configurado via ENV
   */
  static forRoot(): DynamicModule {
    return {
      module: WhatsAppModule,
      imports: [
        ConfigModule,
        HttpModule.register({
          timeout: 30000,
          maxRedirects: 5,
        }),
        PrismaModule,
        InstancesModule,
      ],
      providers: [
        // Providers disponíveis
        ZapsterProvider,
        TwilioProvider,
        MetaProvider,

        // Factory que seleciona o provider ativo
        whatsAppProviderFactory,

        // Serviço principal
        WhatsAppService,
      ],
      exports: [WhatsAppService, WHATSAPP_PROVIDER, InstancesModule],
    }
  }

  /**
   * Registra o módulo com um provider específico (para testes)
   */
  static forTest(provider: WhatsAppProvider): DynamicModule {
    const testProviderFactory: Provider = {
      provide: WHATSAPP_PROVIDER,
      useFactory: (
        zapsterProvider: ZapsterProvider,
        twilioProvider: TwilioProvider,
        metaProvider: MetaProvider
      ) => {
        switch (provider) {
          case WhatsAppProvider.TWILIO:
            return twilioProvider
          case WhatsAppProvider.META:
            return metaProvider
          case WhatsAppProvider.ZAPSTER:
          default:
            return zapsterProvider
        }
      },
      inject: [ZapsterProvider, TwilioProvider, MetaProvider],
    }

    return {
      module: WhatsAppModule,
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        HttpModule.register({
          timeout: 30000,
          maxRedirects: 5,
        }),
        PrismaModule,
      ],
      providers: [
        ZapsterProvider,
        TwilioProvider,
        MetaProvider,
        testProviderFactory,
        WhatsAppService,
      ],
      exports: [WhatsAppService, WHATSAPP_PROVIDER],
    }
  }
}
