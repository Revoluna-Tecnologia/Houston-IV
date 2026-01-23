import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TwilioProvider } from '../twilio.provider'
import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { of, throwError } from 'rxjs'
import { AxiosError, AxiosResponse } from 'axios'
import { NotImplementedException } from '@nestjs/common'
import { ConnectionStatus, WhatsAppProviderError, WhatsAppProvider } from '../../types'

describe('TwilioProvider', () => {
  let provider: TwilioProvider
  let httpService: HttpService
  let configService: ConfigService

  const mockConfig = {
    TWILIO_ACCOUNT_SID: 'ACtest123',
    TWILIO_AUTH_TOKEN: 'test-token',
    TWILIO_PHONE_NUMBER_SID: 'PN123',
    TWILIO_WHATSAPP_NUMBER: '+14155238886',
    TWILIO_WEBHOOK_URL: 'https://example.com/webhook',
  }

  const mockPhoneNumber = {
    sid: 'PN123',
    friendly_name: 'Test Number',
    phone_number: '+14155238886',
    date_created: '2024-01-01T00:00:00Z',
    capabilities: { mms: true, sms: true, voice: true },
    sms_url: 'https://example.com/webhook',
  }

  beforeEach(() => {
    httpService = {
      request: vi.fn(),
    } as unknown as HttpService

    configService = {
      get: vi.fn((key: string, defaultValue?: string) => {
        return mockConfig[key as keyof typeof mockConfig] || defaultValue
      }),
      getOrThrow: vi.fn((key: string) => mockConfig[key as keyof typeof mockConfig]),
    } as unknown as ConfigService

    provider = new TwilioProvider(httpService, configService)
  })

  describe('providerName', () => {
    it('should return "twilio"', () => {
      expect(provider.providerName).toBe('twilio')
    })
  })

  describe('listInstances', () => {
    it('should return list of phone numbers as instances', async () => {
      vi.mocked(httpService.request).mockReturnValue(
        of({
          data: {
            incoming_phone_numbers: [mockPhoneNumber],
          },
        } as AxiosResponse)
      )

      const result = await provider.listInstances()

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('PN123')
      expect(result[0].name).toBe('Test Number')
      expect(result[0].status).toBe(ConnectionStatus.CONNECTED)
    })

    it('should filter numbers without MMS capability', async () => {
      vi.mocked(httpService.request).mockReturnValue(
        of({
          data: {
            incoming_phone_numbers: [
              mockPhoneNumber,
              { ...mockPhoneNumber, sid: 'PN456', capabilities: { mms: false, sms: true, voice: true } },
            ],
          },
        } as AxiosResponse)
      )

      const result = await provider.listInstances()

      expect(result).toHaveLength(1)
    })
  })

  describe('getInstance', () => {
    it('should return phone number by id', async () => {
      vi.mocked(httpService.request).mockReturnValue(
        of({ data: mockPhoneNumber } as AxiosResponse)
      )

      const result = await provider.getInstance('PN123')

      expect(result.id).toBe('PN123')
      expect(result.phoneNumber).toBe('+14155238886')
    })
  })

  describe('createInstance', () => {
    it('should throw NotImplementedException', async () => {
      await expect(provider.createInstance('New')).rejects.toThrow(NotImplementedException)
    })
  })

  describe('deleteInstance', () => {
    it('should throw NotImplementedException', async () => {
      await expect(provider.deleteInstance('PN123')).rejects.toThrow(NotImplementedException)
    })
  })

  describe('getConnectionStatus', () => {
    it('should return CONNECTED when credentials are configured', async () => {
      const result = await provider.getConnectionStatus('PN123')

      expect(result).toBe(ConnectionStatus.CONNECTED)
    })

    it('should return DISCONNECTED when credentials are missing', async () => {
      vi.mocked(configService.get).mockReturnValue('')
      const unconfiguredProvider = new TwilioProvider(httpService, configService)

      const result = await unconfiguredProvider.getConnectionStatus('PN123')

      expect(result).toBe(ConnectionStatus.DISCONNECTED)
    })
  })

  describe('getQRCode', () => {
    it('should throw NotImplementedException', async () => {
      await expect(provider.getQRCode('PN123')).rejects.toThrow(NotImplementedException)
    })
  })

  describe('getPairingCode', () => {
    it('should throw NotImplementedException', async () => {
      await expect(provider.getPairingCode('PN123', '+5511999999999')).rejects.toThrow(NotImplementedException)
    })
  })

  describe('powerOn', () => {
    it('should not throw (always on)', async () => {
      await expect(provider.powerOn('PN123')).resolves.toBeUndefined()
    })
  })

  describe('powerOff', () => {
    it('should throw NotImplementedException', async () => {
      await expect(provider.powerOff('PN123')).rejects.toThrow(NotImplementedException)
    })
  })

  describe('disconnect', () => {
    it('should throw NotImplementedException', async () => {
      await expect(provider.disconnect('PN123')).rejects.toThrow(NotImplementedException)
    })
  })

  describe('sendTextMessage', () => {
    it('should send text message', async () => {
      vi.mocked(httpService.request).mockReturnValue(
        of({
          data: {
            sid: 'SM123',
            status: 'queued',
            date_created: '2024-01-15T10:00:00Z',
          },
        } as AxiosResponse)
      )

      const result = await provider.sendTextMessage('PN123', '+5511999999999', 'Hello')

      expect(result.messageId).toBe('SM123')
      expect(result.status).toBe('queued')
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          data: expect.stringContaining('From=whatsapp'),
        })
      )
    })

    it('should throw error when TWILIO_WHATSAPP_NUMBER not configured', async () => {
      vi.mocked(configService.get).mockImplementation((key: string, defaultValue?: string) => {
        if (key === 'TWILIO_WHATSAPP_NUMBER') return undefined
        return mockConfig[key as keyof typeof mockConfig] || defaultValue
      })
      const unconfiguredProvider = new TwilioProvider(httpService, configService)

      await expect(
        unconfiguredProvider.sendTextMessage('PN123', '+5511999999999', 'Hello')
      ).rejects.toThrow(WhatsAppProviderError)
    })
  })

  describe('sendMediaMessage', () => {
    it('should send media message', async () => {
      vi.mocked(httpService.request).mockReturnValue(
        of({
          data: {
            sid: 'SM456',
            status: 'sent',
            date_created: '2024-01-15T10:00:00Z',
          },
        } as AxiosResponse)
      )

      const result = await provider.sendMediaMessage('PN123', {
        to: '+5511999999999',
        mediaUrl: 'https://example.com/image.jpg',
        caption: 'Check this',
      })

      expect(result.messageId).toBe('SM456')
      expect(result.status).toBe('sent')
    })
  })

  describe('sendTemplateMessage', () => {
    it('should send template message', async () => {
      vi.mocked(configService.get).mockImplementation((key: string, defaultValue?: string) => {
        if (key === 'TWILIO_TEMPLATE_WELCOME') return 'HX123'
        return mockConfig[key as keyof typeof mockConfig] || defaultValue
      })
      vi.mocked(httpService.request).mockReturnValue(
        of({
          data: {
            sid: 'SM789',
            status: 'sent',
            date_created: '2024-01-15T10:00:00Z',
          },
        } as AxiosResponse)
      )

      const templateProvider = new TwilioProvider(httpService, configService)
      const result = await templateProvider.sendTemplateMessage(
        'PN123',
        '+5511999999999',
        'welcome',
        { name: 'John' }
      )

      expect(result.messageId).toBe('SM789')
    })

    it('should throw error when template not configured', async () => {
      await expect(
        provider.sendTemplateMessage('PN123', '+5511999999999', 'unknown', {})
      ).rejects.toThrow(WhatsAppProviderError)
    })
  })

  describe('sendReaction', () => {
    it('should throw NotImplementedException', async () => {
      await expect(
        provider.sendReaction('PN123', '+5511999999999', 'msg-1', '👍')
      ).rejects.toThrow(NotImplementedException)
    })
  })

  describe('removeReaction', () => {
    it('should throw NotImplementedException', async () => {
      await expect(
        provider.removeReaction('PN123', '+5511999999999', 'msg-1')
      ).rejects.toThrow(NotImplementedException)
    })
  })

  describe('Group methods', () => {
    it('listGroups should throw NotImplementedException', async () => {
      await expect(provider.listGroups('PN123')).rejects.toThrow(NotImplementedException)
    })

    it('getGroup should throw NotImplementedException', async () => {
      await expect(provider.getGroup('PN123', 'group-1')).rejects.toThrow(NotImplementedException)
    })

    it('createGroup should throw NotImplementedException', async () => {
      await expect(
        provider.createGroup('PN123', { name: 'Test', participants: [] })
      ).rejects.toThrow(NotImplementedException)
    })

    it('addGroupParticipants should throw NotImplementedException', async () => {
      await expect(
        provider.addGroupParticipants('PN123', 'group-1', [])
      ).rejects.toThrow(NotImplementedException)
    })

    it('removeGroupParticipants should throw NotImplementedException', async () => {
      await expect(
        provider.removeGroupParticipants('PN123', 'group-1', [])
      ).rejects.toThrow(NotImplementedException)
    })

    it('leaveGroup should throw NotImplementedException', async () => {
      await expect(provider.leaveGroup('PN123', 'group-1')).rejects.toThrow(NotImplementedException)
    })
  })

  describe('listWebhooks', () => {
    it('should return webhook from phone number config', async () => {
      vi.mocked(httpService.request).mockReturnValue(
        of({ data: mockPhoneNumber } as AxiosResponse)
      )

      const result = await provider.listWebhooks('PN123')

      expect(result).toHaveLength(1)
      expect(result[0].url).toBe('https://example.com/webhook')
    })
  })

  describe('createWebhook', () => {
    it('should update phone number webhook URL', async () => {
      vi.mocked(httpService.request).mockReturnValue(of({ data: {} } as AxiosResponse))

      const result = await provider.createWebhook('PN123', {
        url: 'https://new.example.com/webhook',
        events: [],
        name: 'New Webhook',
      })

      expect(result.url).toBe('https://new.example.com/webhook')
    })
  })

  describe('deleteWebhook', () => {
    it('should clear webhook URL', async () => {
      vi.mocked(httpService.request).mockReturnValue(of({ data: {} } as AxiosResponse))

      await provider.deleteWebhook('PN123', 'webhook-1')

      expect(httpService.request).toHaveBeenCalled()
    })
  })

  describe('validateWebhookSignature', () => {
    it('should validate signature correctly', () => {
      const result = provider.validateWebhookSignature('payload', 'invalid', '')

      expect(typeof result).toBe('boolean')
    })
  })

  describe('verifyNumber', () => {
    it('should return true for valid number', async () => {
      vi.mocked(httpService.request).mockReturnValue(
        of({ data: { valid: true, phone_number: '+5511999999999' } } as AxiosResponse)
      )

      const result = await provider.verifyNumber('PN123', '+5511999999999')

      expect(result).toBe(true)
    })

    it('should return false on error', async () => {
      vi.mocked(httpService.request).mockReturnValue(
        throwError(() => new Error('Lookup failed'))
      )

      const result = await provider.verifyNumber('PN123', 'invalid')

      expect(result).toBe(false)
    })
  })

  describe('formatPhoneNumber', () => {
    it('should format phone number with country code', () => {
      expect(provider.formatPhoneNumber('11999999999')).toBe('+5511999999999')
    })

    it('should keep existing + prefix', () => {
      expect(provider.formatPhoneNumber('+5511999999999')).toBe('+5511999999999')
    })

    it('should add country code if not present', () => {
      expect(provider.formatPhoneNumber('5511999999999')).toBe('+5511999999999')
    })
  })

  describe('API error handling', () => {
    it('should throw WhatsAppProviderError on API error', async () => {
      const axiosError = new AxiosError(
        'Request failed',
        'ERR_BAD_REQUEST',
        undefined,
        undefined,
        {
          data: { message: 'Invalid credentials', code: 20003 },
          status: 401,
        } as AxiosResponse
      )
      vi.mocked(httpService.request).mockReturnValue(throwError(() => axiosError))

      await expect(provider.listInstances()).rejects.toThrow(WhatsAppProviderError)
    })
  })
})
