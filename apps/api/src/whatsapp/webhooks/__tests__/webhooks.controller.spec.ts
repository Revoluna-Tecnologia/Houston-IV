import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { WebhooksController } from '../webhooks.controller'
import { WebhooksService } from '../webhooks.service'
import { WebhookEvent } from '../../types'
import { createHmac } from 'crypto'

describe('WebhooksController', () => {
  let controller: WebhooksController
  let webhooksService: {
    processZapsterWebhook: Mock
    processTwilioWebhook: Mock
    processMetaWebhook: Mock
  }
  let configService: { get: Mock }

  beforeEach(() => {
    webhooksService = {
      processZapsterWebhook: vi.fn().mockResolvedValue(undefined),
      processTwilioWebhook: vi.fn().mockResolvedValue(undefined),
      processMetaWebhook: vi.fn().mockResolvedValue(undefined),
    }

    configService = {
      get: vi.fn().mockReturnValue(''),
    }

    // Directly instantiate the controller with mocked dependencies
    controller = new WebhooksController(
      webhooksService as unknown as WebhooksService,
      configService as unknown as ConfigService
    )
  })

  describe('handleZapsterWebhook', () => {
    it('should process Zapster webhook and return success', async () => {
      const payload = {
        event: WebhookEvent.MESSAGE_RECEIVED,
        instanceId: 'instance-1',
        data: { messageId: 'wamid.123456', from: '5511999999999', content: 'Hello' },
      }

      const mockReq = { rawBody: Buffer.from(JSON.stringify(payload)) } as any

      const result = await controller.handleZapsterWebhook(
        'instance-1',
        payload,
        '',
        mockReq
      )

      expect(result).toEqual({ success: true })
    })

    it('should add instanceId to payload if not present', async () => {
      const payload = {
        event: WebhookEvent.MESSAGE_RECEIVED,
        data: { messageId: 'wamid.123456', from: '5511999999999', content: 'Hello' },
      } as any

      const mockReq = { rawBody: Buffer.from(JSON.stringify(payload)) } as any

      await controller.handleZapsterWebhook('instance-1', payload, '', mockReq)

      expect(payload.instanceId).toBe('instance-1')
    })

    it('should call service with MESSAGE_DELIVERED event', async () => {
      const payload = {
        event: WebhookEvent.MESSAGE_DELIVERED,
        instanceId: 'instance-1',
        data: { messageId: 'wamid.123456', status: 'delivered' },
      }

      const mockReq = { rawBody: Buffer.from(JSON.stringify(payload)) } as any

      await controller.handleZapsterWebhook('instance-1', payload, '', mockReq)

      expect(webhooksService.processZapsterWebhook).toHaveBeenCalled()
    })

    it('should validate signature when secret is configured', async () => {
      const secret = 'test-secret'
      configService.get.mockReturnValue(secret)

      const payload = {
        event: WebhookEvent.MESSAGE_RECEIVED,
        instanceId: 'instance-1',
        data: { messageId: 'wamid.123456' },
      }

      const rawBody = JSON.stringify(payload)
      const validSignature = createHmac('sha256', secret).update(rawBody).digest('hex')

      const mockReq = { rawBody: Buffer.from(rawBody) } as any

      const result = await controller.handleZapsterWebhook(
        'instance-1',
        payload,
        validSignature,
        mockReq
      )

      expect(result).toEqual({ success: true })
    })

    it('should throw UnauthorizedException for invalid signature', async () => {
      const secret = 'test-secret'
      configService.get.mockReturnValue(secret)

      const payload = {
        event: WebhookEvent.MESSAGE_RECEIVED,
        instanceId: 'instance-1',
        data: { messageId: 'wamid.123456' },
      }

      const mockReq = { rawBody: Buffer.from(JSON.stringify(payload)) } as any

      await expect(
        controller.handleZapsterWebhook('instance-1', payload, 'invalid-signature', mockReq)
      ).rejects.toThrow(UnauthorizedException)
    })
  })

  describe('handleZapsterWebhookGeneric', () => {
    it('should process generic Zapster webhook', async () => {
      const payload = {
        event: WebhookEvent.MESSAGE_RECEIVED,
        instanceId: 'instance-1',
        data: { messageId: 'wamid.123456' },
      }

      const mockReq = { rawBody: Buffer.from(JSON.stringify(payload)) } as any

      const result = await controller.handleZapsterWebhookGeneric(payload, '', mockReq)

      expect(result).toEqual({ success: true })
    })

    it('should validate signature for generic webhook', async () => {
      const secret = 'test-secret'
      configService.get.mockReturnValue(secret)

      const payload = {
        event: WebhookEvent.MESSAGE_RECEIVED,
        instanceId: 'instance-1',
        data: { messageId: 'wamid.123456' },
      }

      const rawBody = JSON.stringify(payload)
      const validSignature = createHmac('sha256', secret).update(rawBody).digest('hex')

      const mockReq = { rawBody: Buffer.from(rawBody) } as any

      const result = await controller.handleZapsterWebhookGeneric(payload, validSignature, mockReq)

      expect(result).toEqual({ success: true })
    })
  })

  describe('handleTwilioWebhook', () => {
    it('should process Twilio webhook and return TwiML response', async () => {
      const payload = {
        MessageSid: 'SM123456',
        SmsStatus: 'delivered',
        From: '',
        To: '',
        Body: '',
      }

      const mockReq = { body: payload } as any

      const result = await controller.handleTwilioWebhook(payload, '', mockReq)

      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>')
      expect(result).toContain('<Response></Response>')
    })

    it('should call service with incoming message payload', async () => {
      const payload = {
        MessageSid: 'SM123456',
        SmsStatus: 'received',
        From: 'whatsapp:+5511999999999',
        To: 'whatsapp:+5511888888888',
        Body: 'Hello from Twilio',
      }

      const mockReq = { body: payload } as any

      await controller.handleTwilioWebhook(payload, '', mockReq)

      expect(webhooksService.processTwilioWebhook).toHaveBeenCalledWith(payload)
    })

    it('should skip validation when auth token is not configured', async () => {
      configService.get.mockReturnValue('')

      const payload = {
        MessageSid: 'SM123456',
        SmsStatus: 'delivered',
        From: '',
        To: '',
        Body: '',
      }

      const mockReq = { body: payload } as any

      const result = await controller.handleTwilioWebhook(payload, 'any-signature', mockReq)

      expect(result).toContain('<Response></Response>')
    })
  })

  describe('handleMetaVerification', () => {
    it('should return challenge when verification succeeds', () => {
      const verifyToken = 'my-verify-token'
      configService.get.mockReturnValue(verifyToken)

      const result = controller.handleMetaVerification(
        'subscribe',
        verifyToken,
        'challenge-123'
      )

      expect(result).toBe('challenge-123')
    })

    it('should throw UnauthorizedException when token does not match', () => {
      configService.get.mockReturnValue('expected-token')

      expect(() =>
        controller.handleMetaVerification('subscribe', 'wrong-token', 'challenge-123')
      ).toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException when mode is not subscribe', () => {
      configService.get.mockReturnValue('my-token')

      expect(() =>
        controller.handleMetaVerification('unsubscribe', 'my-token', 'challenge-123')
      ).toThrow(UnauthorizedException)
    })
  })

  describe('handleMetaWebhook', () => {
    it('should process Meta webhook and return success', async () => {
      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'entry-1',
            changes: [
              {
                field: 'messages',
                value: {
                  messages: [{ id: 'wamid.123456', from: '5511999999999', type: 'text' }],
                },
              },
            ],
          },
        ],
      }

      const mockReq = { rawBody: Buffer.from(JSON.stringify(payload)) } as any

      const result = await controller.handleMetaWebhook(payload, '', mockReq)

      expect(result).toEqual({ success: true })
    })

    it('should call service with status update payload', async () => {
      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'entry-1',
            changes: [
              {
                field: 'messages',
                value: {
                  statuses: [
                    { id: 'wamid.123456', status: 'delivered', recipient_id: '5511999999999' },
                  ],
                },
              },
            ],
          },
        ],
      }

      const mockReq = { rawBody: Buffer.from(JSON.stringify(payload)) } as any

      await controller.handleMetaWebhook(payload, '', mockReq)

      expect(webhooksService.processMetaWebhook).toHaveBeenCalledWith(payload)
    })

    it('should validate signature when app secret is configured', async () => {
      const appSecret = 'test-app-secret'
      configService.get.mockReturnValue(appSecret)

      const payload = {
        object: 'whatsapp_business_account',
        entry: [],
      }

      const rawBody = JSON.stringify(payload)
      const validSignature = `sha256=${createHmac('sha256', appSecret)
        .update(rawBody)
        .digest('hex')}`

      const mockReq = { rawBody: Buffer.from(rawBody) } as any

      const result = await controller.handleMetaWebhook(payload, validSignature, mockReq)

      expect(result).toEqual({ success: true })
    })

    it('should throw UnauthorizedException for invalid Meta signature', async () => {
      const appSecret = 'test-app-secret'
      configService.get.mockReturnValue(appSecret)

      const payload = {
        object: 'whatsapp_business_account',
        entry: [],
      }

      const mockReq = { rawBody: Buffer.from(JSON.stringify(payload)) } as any

      await expect(
        controller.handleMetaWebhook(payload, 'sha256=invalid', mockReq)
      ).rejects.toThrow(UnauthorizedException)
    })
  })
})
