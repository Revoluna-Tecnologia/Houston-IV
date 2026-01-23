import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ZapsterProvider } from '../zapster.provider'
import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { of, throwError } from 'rxjs'
import { AxiosError, AxiosResponse } from 'axios'
import { ConnectionStatus, WhatsAppProviderError, WebhookEvent } from '../../types'

describe('ZapsterProvider', () => {
  let provider: ZapsterProvider
  let httpService: HttpService
  let configService: ConfigService

  const mockConfig = {
    ZAPSTER_API_URL: 'https://api.zapsterapi.com/v1',
    ZAPSTER_API_KEY: 'test-api-key',
    ZAPSTER_WEBHOOK_SECRET: 'webhook-secret',
  }

  const mockInstance = {
    id: 'inst-1',
    name: 'Test Instance',
    status: 'connected',
    phoneNumber: '+5511999999999',
    createdAt: '2024-01-01T00:00:00Z',
  }

  const mockGroup = {
    id: 'group-1',
    name: 'Test Group',
    description: 'A test group',
    participants: ['+5511111111111'],
    admins: ['+5511111111111'],
    createdAt: '2024-01-01T00:00:00Z',
  }

  const mockWebhook = {
    id: 'wh-1',
    url: 'https://example.com/webhook',
    events: ['message.received'],
    name: 'Test Webhook',
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
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

    provider = new ZapsterProvider(httpService, configService)
  })

  describe('providerName', () => {
    it('should return "zapster"', () => {
      expect(provider.providerName).toBe('zapster')
    })
  })

  describe('listInstances', () => {
    it('should call correct API endpoint', async () => {
      vi.mocked(httpService.request).mockReturnValue(
        of({ data: { data: [] } } as AxiosResponse)
      )

      await provider.listInstances()

      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: 'https://api.zapsterapi.com/v1/instances',
        })
      )
    })
  })

  describe('getInstance', () => {
    it('should call correct API endpoint', async () => {
      vi.mocked(httpService.request).mockReturnValue(
        of({ data: mockInstance } as AxiosResponse)
      )

      await provider.getInstance('inst-1')

      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: 'https://api.zapsterapi.com/v1/instances/inst-1',
        })
      )
    })
  })

  describe('createInstance', () => {
    it('should create new instance', async () => {
      vi.mocked(httpService.request).mockReturnValue(
        of({ data: mockInstance } as AxiosResponse)
      )

      await provider.createInstance('New Instance')

      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: 'https://api.zapsterapi.com/v1/instances',
          data: { name: 'New Instance' },
        })
      )
    })
  })

  describe('deleteInstance', () => {
    it('should delete instance', async () => {
      vi.mocked(httpService.request).mockReturnValue(of({ data: {} } as AxiosResponse))

      await provider.deleteInstance('inst-1')

      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'DELETE',
          url: 'https://api.zapsterapi.com/v1/instances/inst-1',
        })
      )
    })
  })

  describe('getConnectionStatus', () => {
    it('should return connection status', async () => {
      vi.mocked(httpService.request).mockReturnValue(
        of({ data: { status: 'connected' } } as AxiosResponse)
      )

      const result = await provider.getConnectionStatus('inst-1')

      expect(result).toBe(ConnectionStatus.CONNECTED)
    })

    it('should map disconnected status', async () => {
      vi.mocked(httpService.request).mockReturnValue(
        of({ data: { status: 'disconnected' } } as AxiosResponse)
      )

      const result = await provider.getConnectionStatus('inst-1')

      expect(result).toBe(ConnectionStatus.DISCONNECTED)
    })

    it('should map connecting status', async () => {
      vi.mocked(httpService.request).mockReturnValue(
        of({ data: { status: 'connecting' } } as AxiosResponse)
      )

      const result = await provider.getConnectionStatus('inst-1')

      expect(result).toBe(ConnectionStatus.CONNECTING)
    })
  })

  describe('getQRCode', () => {
    it('should return QR code data', async () => {
      vi.mocked(httpService.request).mockReturnValue(
        of({ data: { qr: 'base64data', expiresAt: '2024-01-15T10:00:00Z' } } as AxiosResponse)
      )

      const result = await provider.getQRCode('inst-1')

      expect(result.qr).toContain('data:image/png;base64')
      expect(result.expiresAt).toBeInstanceOf(Date)
    })

    it('should keep data URI if already present', async () => {
      vi.mocked(httpService.request).mockReturnValue(
        of({ data: { qr: 'data:image/png;base64,xyz' } } as AxiosResponse)
      )

      const result = await provider.getQRCode('inst-1')

      expect(result.qr).toBe('data:image/png;base64,xyz')
    })
  })

  describe('getPairingCode', () => {
    it('should return pairing code', async () => {
      vi.mocked(httpService.request).mockReturnValue(
        of({ data: { code: '123456', expiresAt: '2024-01-15T10:00:00Z' } } as AxiosResponse)
      )

      const result = await provider.getPairingCode('inst-1', '+5511999999999')

      expect(result.code).toBe('123456')
      expect(result.expiresAt).toBeInstanceOf(Date)
    })
  })

  describe('powerOn', () => {
    it('should power on instance', async () => {
      vi.mocked(httpService.request).mockReturnValue(of({ data: {} } as AxiosResponse))

      await provider.powerOn('inst-1')

      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: 'https://api.zapsterapi.com/v1/instances/inst-1/power-on',
        })
      )
    })
  })

  describe('powerOff', () => {
    it('should power off instance', async () => {
      vi.mocked(httpService.request).mockReturnValue(of({ data: {} } as AxiosResponse))

      await provider.powerOff('inst-1')

      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: 'https://api.zapsterapi.com/v1/instances/inst-1/power-off',
        })
      )
    })
  })

  describe('disconnect', () => {
    it('should disconnect instance', async () => {
      vi.mocked(httpService.request).mockReturnValue(of({ data: {} } as AxiosResponse))

      await provider.disconnect('inst-1')

      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: 'https://api.zapsterapi.com/v1/instances/inst-1/logout',
        })
      )
    })
  })

  describe('sendTextMessage', () => {
    it('should send text message', async () => {
      vi.mocked(httpService.request).mockReturnValue(
        of({
          data: { messageId: 'msg-1', timestamp: '2024-01-15T10:00:00Z' },
        } as AxiosResponse)
      )

      const result = await provider.sendTextMessage('inst-1', '+5511999999999', 'Hello')

      expect(result.messageId).toBe('msg-1')
      expect(result.status).toBe('sent')
    })

    it('should send text message with reply', async () => {
      vi.mocked(httpService.request).mockReturnValue(
        of({
          data: { messageId: 'msg-2', timestamp: '2024-01-15T10:00:00Z' },
        } as AxiosResponse)
      )

      await provider.sendTextMessage('inst-1', '+5511999999999', 'Reply', 'original-msg')

      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            quotedMessageId: 'original-msg',
          }),
        })
      )
    })
  })

  describe('sendMediaMessage', () => {
    it('should send media message', async () => {
      vi.mocked(httpService.request).mockReturnValue(
        of({
          data: { messageId: 'msg-3', timestamp: '2024-01-15T10:00:00Z' },
        } as AxiosResponse)
      )

      const result = await provider.sendMediaMessage('inst-1', {
        to: '+5511999999999',
        mediaType: 'image',
        mediaUrl: 'https://example.com/image.jpg',
        caption: 'Check this',
      })

      expect(result.messageId).toBe('msg-3')
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://api.zapsterapi.com/v1/instances/inst-1/messages/media',
        })
      )
    })
  })

  describe('sendReaction', () => {
    it('should send reaction', async () => {
      vi.mocked(httpService.request).mockReturnValue(of({ data: {} } as AxiosResponse))

      await provider.sendReaction('inst-1', '+5511999999999', 'msg-1', '👍')

      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: 'https://api.zapsterapi.com/v1/instances/inst-1/messages/msg-1/reaction',
          data: expect.objectContaining({ emoji: '👍' }),
        })
      )
    })
  })

  describe('removeReaction', () => {
    it('should remove reaction', async () => {
      vi.mocked(httpService.request).mockReturnValue(of({ data: {} } as AxiosResponse))

      await provider.removeReaction('inst-1', '+5511999999999', 'msg-1')

      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'DELETE',
          url: 'https://api.zapsterapi.com/v1/instances/inst-1/messages/msg-1/reaction',
        })
      )
    })
  })

  describe('Group operations', () => {
    describe('listGroups', () => {
      it('should call correct API endpoint', async () => {
        vi.mocked(httpService.request).mockReturnValue(
          of({ data: { data: [] } } as AxiosResponse)
        )

        await provider.listGroups('inst-1')

        expect(httpService.request).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'GET',
            url: 'https://api.zapsterapi.com/v1/instances/inst-1/groups',
          })
        )
      })
    })

    describe('getGroup', () => {
      it('should call correct API endpoint', async () => {
        vi.mocked(httpService.request).mockReturnValue(
          of({ data: mockGroup } as AxiosResponse)
        )

        await provider.getGroup('inst-1', 'group-1')

        expect(httpService.request).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'GET',
            url: 'https://api.zapsterapi.com/v1/instances/inst-1/groups/group-1',
          })
        )
      })
    })

    describe('createGroup', () => {
      it('should call correct API endpoint', async () => {
        vi.mocked(httpService.request).mockReturnValue(
          of({ data: mockGroup } as AxiosResponse)
        )

        await provider.createGroup('inst-1', {
          name: 'New Group',
          participants: ['+5511111111111'],
          description: 'Description',
        })

        expect(httpService.request).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'POST',
            url: 'https://api.zapsterapi.com/v1/instances/inst-1/groups',
          })
        )
      })
    })

    describe('addGroupParticipants', () => {
      it('should add participants', async () => {
        vi.mocked(httpService.request).mockReturnValue(of({ data: {} } as AxiosResponse))

        await provider.addGroupParticipants('inst-1', 'group-1', ['+5522222222222'])

        expect(httpService.request).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'POST',
            url: 'https://api.zapsterapi.com/v1/instances/inst-1/groups/group-1/participants',
          })
        )
      })
    })

    describe('removeGroupParticipants', () => {
      it('should remove participants', async () => {
        vi.mocked(httpService.request).mockReturnValue(of({ data: {} } as AxiosResponse))

        await provider.removeGroupParticipants('inst-1', 'group-1', ['+5522222222222'])

        expect(httpService.request).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'DELETE',
            url: 'https://api.zapsterapi.com/v1/instances/inst-1/groups/group-1/participants',
          })
        )
      })
    })

    describe('promoteGroupParticipants', () => {
      it('should promote participants to admin', async () => {
        vi.mocked(httpService.request).mockReturnValue(of({ data: {} } as AxiosResponse))

        await provider.promoteGroupParticipants('inst-1', 'group-1', ['+5522222222222'])

        expect(httpService.request).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'POST',
            url: 'https://api.zapsterapi.com/v1/instances/inst-1/groups/group-1/admins',
          })
        )
      })
    })

    describe('demoteGroupParticipants', () => {
      it('should demote participants from admin', async () => {
        vi.mocked(httpService.request).mockReturnValue(of({ data: {} } as AxiosResponse))

        await provider.demoteGroupParticipants('inst-1', 'group-1', ['+5522222222222'])

        expect(httpService.request).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'DELETE',
            url: 'https://api.zapsterapi.com/v1/instances/inst-1/groups/group-1/admins',
          })
        )
      })
    })

    describe('leaveGroup', () => {
      it('should leave group', async () => {
        vi.mocked(httpService.request).mockReturnValue(of({ data: {} } as AxiosResponse))

        await provider.leaveGroup('inst-1', 'group-1')

        expect(httpService.request).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'POST',
            url: 'https://api.zapsterapi.com/v1/instances/inst-1/groups/group-1/leave',
          })
        )
      })
    })
  })

  describe('Webhook operations', () => {
    describe('listWebhooks', () => {
      it('should call correct API endpoint', async () => {
        vi.mocked(httpService.request).mockReturnValue(
          of({ data: { data: [] } } as AxiosResponse)
        )

        await provider.listWebhooks('inst-1')

        expect(httpService.request).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'GET',
            url: 'https://api.zapsterapi.com/v1/instances/inst-1/webhooks',
          })
        )
      })
    })

    describe('createWebhook', () => {
      it('should call correct API endpoint', async () => {
        vi.mocked(httpService.request).mockReturnValue(
          of({ data: mockWebhook } as AxiosResponse)
        )

        await provider.createWebhook('inst-1', {
          url: 'https://example.com/webhook',
          events: [WebhookEvent.MESSAGE_RECEIVED],
          name: 'New Webhook',
        })

        expect(httpService.request).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'POST',
            url: 'https://api.zapsterapi.com/v1/instances/inst-1/webhooks',
          })
        )
      })
    })

    describe('deleteWebhook', () => {
      it('should delete webhook', async () => {
        vi.mocked(httpService.request).mockReturnValue(of({ data: {} } as AxiosResponse))

        await provider.deleteWebhook('inst-1', 'wh-1')

        expect(httpService.request).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'DELETE',
            url: 'https://api.zapsterapi.com/v1/instances/inst-1/webhooks/wh-1',
          })
        )
      })
    })
  })

  describe('validateWebhookSignature', () => {
    it('should validate correct signature', () => {
      const { createHmac } = require('crypto')
      const payload = 'test-payload'
      const signature = createHmac('sha256', 'webhook-secret')
        .update(payload)
        .digest('hex')

      const result = provider.validateWebhookSignature(payload, signature, 'webhook-secret')

      expect(result).toBe(true)
    })

    it('should reject incorrect signature', () => {
      const result = provider.validateWebhookSignature('payload', 'wrong-signature', 'secret')

      expect(result).toBe(false)
    })
  })

  describe('verifyNumber', () => {
    it('should return true for existing number', async () => {
      vi.mocked(httpService.request).mockReturnValue(
        of({ data: { exists: true } } as AxiosResponse)
      )

      const result = await provider.verifyNumber('inst-1', '+5511999999999')

      expect(result).toBe(true)
    })

    it('should return false on error', async () => {
      vi.mocked(httpService.request).mockReturnValue(
        throwError(() => new Error('Not found'))
      )

      const result = await provider.verifyNumber('inst-1', 'invalid')

      expect(result).toBe(false)
    })
  })

  describe('getContactInfo', () => {
    it('should return contact info', async () => {
      vi.mocked(httpService.request).mockReturnValue(
        of({ data: { name: 'John', profilePicture: 'https://example.com/pic.jpg' } } as AxiosResponse)
      )

      const result = await provider.getContactInfo('inst-1', '+5511999999999')

      expect(result.name).toBe('John')
      expect(result.profilePicture).toBe('https://example.com/pic.jpg')
    })

    it('should return empty object on error', async () => {
      vi.mocked(httpService.request).mockReturnValue(
        throwError(() => new Error('Not found'))
      )

      const result = await provider.getContactInfo('inst-1', 'invalid')

      expect(result).toEqual({})
    })
  })

  describe('formatPhoneNumber', () => {
    it('should add country code if not present', () => {
      expect(provider.formatPhoneNumber('11999999999')).toBe('5511999999999')
    })

    it('should keep number with country code', () => {
      expect(provider.formatPhoneNumber('5511999999999')).toBe('5511999999999')
    })

    it('should remove non-numeric characters', () => {
      expect(provider.formatPhoneNumber('+55 (11) 99999-9999')).toBe('5511999999999')
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
          data: { message: 'Invalid API key', code: 'UNAUTHORIZED' },
          status: 401,
        } as AxiosResponse
      )
      vi.mocked(httpService.request).mockReturnValue(throwError(() => axiosError))

      await expect(provider.listInstances()).rejects.toThrow(WhatsAppProviderError)
    })

    it('should rethrow non-Axios errors', async () => {
      vi.mocked(httpService.request).mockReturnValue(
        throwError(() => new Error('Unknown error'))
      )

      await expect(provider.listInstances()).rejects.toThrow('Unknown error')
    })
  })
})
