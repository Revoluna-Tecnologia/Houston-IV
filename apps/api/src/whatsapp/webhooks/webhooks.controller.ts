/**
 * Webhooks Controller
 * Endpoints para receber eventos dos providers de WhatsApp
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
  UnauthorizedException,
  RawBodyRequest,
  Req,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'
import { Request } from 'express'
import { createHmac } from 'crypto'
import { WebhooksService } from './webhooks.service'
import {
  ZapsterWebhookPayloadDto,
  TwilioWebhookPayloadDto,
  MetaWebhookPayloadDto,
} from './dto'
import { Public } from '../../auth/decorators/public.decorator'

@ApiTags('Webhooks')
@Controller('webhooks/whatsapp')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name)

  constructor(
    private readonly service: WebhooksService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Webhook para Zapster
   */
  @Post('zapster/:instanceId')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook para eventos do Zapster' })
  @ApiResponse({ status: 200, description: 'Evento processado' })
  @ApiResponse({ status: 401, description: 'Assinatura inválida' })
  async handleZapsterWebhook(
    @Param('instanceId') instanceId: string,
    @Body() payload: ZapsterWebhookPayloadDto,
    @Headers('x-zapster-signature') signature: string,
    @Req() req: RawBodyRequest<Request>
  ): Promise<{ success: boolean }> {
    this.logger.debug(`Zapster webhook received for instance ${instanceId}`)

    // Validar assinatura
    const secret = this.configService.get<string>('ZAPSTER_WEBHOOK_SECRET', '')
    if (secret) {
      const rawBody = req.rawBody?.toString() || JSON.stringify(payload)
      const isValid = this.validateSignature(rawBody, signature, secret, 'sha256')
      if (!isValid) {
        this.logger.warn('Invalid Zapster webhook signature')
        throw new UnauthorizedException('Assinatura inválida')
      }
    }

    // Adicionar instanceId ao payload se não estiver presente
    if (!payload.instanceId) {
      payload.instanceId = instanceId
    }

    // Processar em background para retornar rápido
    this.service.processZapsterWebhook(payload).catch((error) => {
      this.logger.error(`Error processing Zapster webhook: ${error.message}`)
    })

    return { success: true }
  }

  /**
   * Webhook genérico para Zapster (sem instanceId na URL)
   */
  @Post('zapster')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook genérico para eventos do Zapster' })
  @ApiResponse({ status: 200, description: 'Evento processado' })
  async handleZapsterWebhookGeneric(
    @Body() payload: ZapsterWebhookPayloadDto,
    @Headers('x-zapster-signature') signature: string,
    @Req() req: RawBodyRequest<Request>
  ): Promise<{ success: boolean }> {
    this.logger.debug('Zapster webhook received (generic)')

    // Validar assinatura
    const secret = this.configService.get<string>('ZAPSTER_WEBHOOK_SECRET', '')
    if (secret) {
      const rawBody = req.rawBody?.toString() || JSON.stringify(payload)
      const isValid = this.validateSignature(rawBody, signature, secret, 'sha256')
      if (!isValid) {
        this.logger.warn('Invalid Zapster webhook signature')
        throw new UnauthorizedException('Assinatura inválida')
      }
    }

    this.service.processZapsterWebhook(payload).catch((error) => {
      this.logger.error(`Error processing Zapster webhook: ${error.message}`)
    })

    return { success: true }
  }

  /**
   * Webhook para Twilio
   */
  @Post('twilio')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook para eventos do Twilio' })
  @ApiResponse({ status: 200, description: 'Evento processado' })
  async handleTwilioWebhook(
    @Body() payload: TwilioWebhookPayloadDto,
    @Headers('x-twilio-signature') signature: string,
    @Req() req: RawBodyRequest<Request>
  ): Promise<string> {
    this.logger.debug('Twilio webhook received')

    // Validar assinatura do Twilio
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN', '')
    const webhookUrl = this.configService.get<string>('TWILIO_WEBHOOK_URL', '')

    if (authToken && webhookUrl) {
      const params = req.body as Record<string, string>
      const isValid = this.validateTwilioSignature(webhookUrl, params, signature, authToken)
      if (!isValid) {
        this.logger.warn('Invalid Twilio webhook signature')
        throw new UnauthorizedException('Assinatura inválida')
      }
    }

    this.service.processTwilioWebhook(payload).catch((error) => {
      this.logger.error(`Error processing Twilio webhook: ${error.message}`)
    })

    // Twilio espera uma resposta TwiML vazia
    return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'
  }

  /**
   * Webhook para Meta (verificação de hub challenge)
   */
  @Get('meta')
  @Public()
  @ApiExcludeEndpoint()
  handleMetaVerification(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string
  ): string {
    this.logger.debug('Meta webhook verification request')

    const expectedToken = this.configService.get<string>('META_VERIFY_TOKEN', '')

    if (mode === 'subscribe' && verifyToken === expectedToken) {
      this.logger.log('Meta webhook verified successfully')
      return challenge
    }

    this.logger.warn('Meta webhook verification failed')
    throw new UnauthorizedException('Token de verificação inválido')
  }

  /**
   * Webhook para Meta (eventos)
   */
  @Post('meta')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook para eventos da Meta' })
  @ApiResponse({ status: 200, description: 'Evento processado' })
  async handleMetaWebhook(
    @Body() payload: MetaWebhookPayloadDto,
    @Headers('x-hub-signature-256') signature: string,
    @Req() req: RawBodyRequest<Request>
  ): Promise<{ success: boolean }> {
    this.logger.debug('Meta webhook received')

    // Validar assinatura
    const appSecret = this.configService.get<string>('META_APP_SECRET', '')
    if (appSecret) {
      const rawBody = req.rawBody?.toString() || JSON.stringify(payload)
      const expectedSignature = `sha256=${createHmac('sha256', appSecret)
        .update(rawBody)
        .digest('hex')}`

      if (signature !== expectedSignature) {
        this.logger.warn('Invalid Meta webhook signature')
        throw new UnauthorizedException('Assinatura inválida')
      }
    }

    this.service.processMetaWebhook(payload).catch((error) => {
      this.logger.error(`Error processing Meta webhook: ${error.message}`)
    })

    return { success: true }
  }

  // === Private Methods ===

  private validateSignature(
    payload: string,
    signature: string,
    secret: string,
    algorithm: 'sha256' | 'sha1'
  ): boolean {
    if (!signature || !secret) return true // Skip validation if no secret

    const expectedSignature = createHmac(algorithm, secret).update(payload).digest('hex')
    return signature === expectedSignature
  }

  private validateTwilioSignature(
    url: string,
    params: Record<string, string>,
    signature: string,
    authToken: string
  ): boolean {
    // Twilio usa uma validação específica
    // Concatena URL + params ordenados
    const sortedKeys = Object.keys(params).sort()
    let data = url
    for (const key of sortedKeys) {
      data += key + params[key]
    }

    const expectedSignature = createHmac('sha1', authToken).update(data).digest('base64')
    return signature === expectedSignature
  }
}
