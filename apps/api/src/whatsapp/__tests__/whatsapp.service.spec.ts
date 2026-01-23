import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WhatsAppService } from '../whatsapp.service'
import { IWhatsAppProvider } from '../providers/whatsapp-provider.interface'
import { ConfigService } from '@nestjs/config'
import { WhatsAppProvider, ConnectionStatus, WebhookEvent } from '../types'

describe('WhatsAppService', () => {
  let service: WhatsAppService
  let provider: IWhatsAppProvider
  let configService: ConfigService

  const mockInstance = {
    id: 'instance-1',
    name: 'Test Instance',
    status: ConnectionStatus.CONNECTED,
    phoneNumber: '+5511999999999',
    createdAt: new Date(),
  }

  const mockMessage = {
    messageId: 'msg-1',
    timestamp: new Date(),
    status: 'sent' as const,
  }

  const mockGroup = {
    id: 'group-1',
    name: 'Test Group',
    participants: ['+5511111111111', '+5522222222222'],
    admins: ['+5511111111111'],
  }

  const mockWebhook = {
    id: 'webhook-1',
    url: 'https://example.com/webhook',
    events: [WebhookEvent.MESSAGE_RECEIVED],
    name: 'Test Webhook',
    active: true,
    createdAt: new Date(),
  }

  beforeEach(() => {
    provider = {
      providerName: 'zapster',
      listInstances: vi.fn(),
      getInstance: vi.fn(),
      createInstance: vi.fn(),
      deleteInstance: vi.fn(),
      getConnectionStatus: vi.fn(),
      getQRCode: vi.fn(),
      getPairingCode: vi.fn(),
      powerOn: vi.fn(),
      powerOff: vi.fn(),
      disconnect: vi.fn(),
      sendTextMessage: vi.fn(),
      sendMediaMessage: vi.fn(),
      sendTemplateMessage: vi.fn(),
      sendReaction: vi.fn(),
      removeReaction: vi.fn(),
      listGroups: vi.fn(),
      getGroup: vi.fn(),
      createGroup: vi.fn(),
      addGroupParticipants: vi.fn(),
      removeGroupParticipants: vi.fn(),
      leaveGroup: vi.fn(),
      listWebhooks: vi.fn(),
      createWebhook: vi.fn(),
      deleteWebhook: vi.fn(),
      validateWebhookSignature: vi.fn(),
      verifyNumber: vi.fn(),
      getContactInfo: vi.fn(),
      formatPhoneNumber: vi.fn(),
    }

    configService = {
      get: vi.fn().mockReturnValue(WhatsAppProvider.ZAPSTER),
    } as unknown as ConfigService

    service = new WhatsAppService(provider, configService)
  })

  describe('onModuleInit', () => {
    it('should log provider initialization', () => {
      expect(() => service.onModuleInit()).not.toThrow()
    })
  })

  describe('getActiveProvider', () => {
    it('should return the active provider', () => {
      expect(service.getActiveProvider()).toBe(WhatsAppProvider.ZAPSTER)
    })
  })

  describe('supportsGroups', () => {
    it('should return true for ZAPSTER provider', () => {
      expect(service.supportsGroups()).toBe(true)
    })

    it('should return false for other providers', () => {
      vi.mocked(configService.get).mockReturnValue(WhatsAppProvider.TWILIO)
      const twilioService = new WhatsAppService(provider, configService)

      expect(twilioService.supportsGroups()).toBe(false)
    })
  })

  describe('supportsTemplates', () => {
    it('should return false for ZAPSTER provider', () => {
      expect(service.supportsTemplates()).toBe(false)
    })

    it('should return true for TWILIO provider', () => {
      vi.mocked(configService.get).mockReturnValue(WhatsAppProvider.TWILIO)
      const twilioService = new WhatsAppService(provider, configService)

      expect(twilioService.supportsTemplates()).toBe(true)
    })

    it('should return true for META provider', () => {
      vi.mocked(configService.get).mockReturnValue(WhatsAppProvider.META)
      const metaService = new WhatsAppService(provider, configService)

      expect(metaService.supportsTemplates()).toBe(true)
    })
  })

  describe('Instance Management', () => {
    describe('listInstances', () => {
      it('should return list of instances', async () => {
        vi.mocked(provider.listInstances).mockResolvedValue([mockInstance])

        const result = await service.listInstances()

        expect(provider.listInstances).toHaveBeenCalled()
        expect(result).toEqual([mockInstance])
      })
    })

    describe('getInstance', () => {
      it('should return instance by id', async () => {
        vi.mocked(provider.getInstance).mockResolvedValue(mockInstance)

        const result = await service.getInstance('instance-1')

        expect(provider.getInstance).toHaveBeenCalledWith('instance-1')
        expect(result).toEqual(mockInstance)
      })
    })

    describe('createInstance', () => {
      it('should create a new instance', async () => {
        vi.mocked(provider.createInstance).mockResolvedValue(mockInstance)

        const result = await service.createInstance('New Instance')

        expect(provider.createInstance).toHaveBeenCalledWith('New Instance')
        expect(result).toEqual(mockInstance)
      })
    })

    describe('deleteInstance', () => {
      it('should delete an instance', async () => {
        vi.mocked(provider.deleteInstance).mockResolvedValue(undefined)

        await service.deleteInstance('instance-1')

        expect(provider.deleteInstance).toHaveBeenCalledWith('instance-1')
      })
    })

    describe('getConnectionStatus', () => {
      it('should return connection status', async () => {
        vi.mocked(provider.getConnectionStatus).mockResolvedValue(ConnectionStatus.CONNECTED)

        const result = await service.getConnectionStatus('instance-1')

        expect(provider.getConnectionStatus).toHaveBeenCalledWith('instance-1')
        expect(result).toBe(ConnectionStatus.CONNECTED)
      })
    })

    describe('getQRCode', () => {
      it('should return QR code', async () => {
        const qrResponse = { qr: 'data:image/png;base64,...', expiresAt: new Date() }
        vi.mocked(provider.getQRCode).mockResolvedValue(qrResponse)

        const result = await service.getQRCode('instance-1')

        expect(provider.getQRCode).toHaveBeenCalledWith('instance-1')
        expect(result).toEqual(qrResponse)
      })
    })

    describe('getPairingCode', () => {
      it('should return pairing code', async () => {
        const pairingResponse = { code: '123456', expiresAt: new Date() }
        vi.mocked(provider.getPairingCode).mockResolvedValue(pairingResponse)

        const result = await service.getPairingCode('instance-1', '+5511999999999')

        expect(provider.getPairingCode).toHaveBeenCalledWith('instance-1', '+5511999999999')
        expect(result).toEqual(pairingResponse)
      })
    })

    describe('powerOn', () => {
      it('should power on instance', async () => {
        vi.mocked(provider.powerOn).mockResolvedValue(undefined)

        await service.powerOn('instance-1')

        expect(provider.powerOn).toHaveBeenCalledWith('instance-1')
      })
    })

    describe('powerOff', () => {
      it('should power off instance', async () => {
        vi.mocked(provider.powerOff).mockResolvedValue(undefined)

        await service.powerOff('instance-1')

        expect(provider.powerOff).toHaveBeenCalledWith('instance-1')
      })
    })

    describe('disconnect', () => {
      it('should disconnect instance', async () => {
        vi.mocked(provider.disconnect).mockResolvedValue(undefined)

        await service.disconnect('instance-1')

        expect(provider.disconnect).toHaveBeenCalledWith('instance-1')
      })
    })
  })

  describe('Messaging', () => {
    describe('sendTextMessage', () => {
      it('should send text message', async () => {
        vi.mocked(provider.sendTextMessage).mockResolvedValue(mockMessage)

        const result = await service.sendTextMessage('instance-1', '+5511999999999', 'Hello')

        expect(provider.sendTextMessage).toHaveBeenCalledWith(
          'instance-1',
          '+5511999999999',
          'Hello',
          undefined
        )
        expect(result).toEqual(mockMessage)
      })

      it('should send text message with reply', async () => {
        vi.mocked(provider.sendTextMessage).mockResolvedValue(mockMessage)

        await service.sendTextMessage('instance-1', '+5511999999999', 'Reply', 'original-msg-1')

        expect(provider.sendTextMessage).toHaveBeenCalledWith(
          'instance-1',
          '+5511999999999',
          'Reply',
          'original-msg-1'
        )
      })
    })

    describe('sendMediaMessage', () => {
      it('should send media message', async () => {
        const payload = {
          to: '+5511999999999',
          mediaType: 'image' as const,
          mediaUrl: 'https://example.com/image.jpg',
          caption: 'Check this out',
        }
        vi.mocked(provider.sendMediaMessage).mockResolvedValue(mockMessage)

        const result = await service.sendMediaMessage('instance-1', payload)

        expect(provider.sendMediaMessage).toHaveBeenCalledWith('instance-1', payload)
        expect(result).toEqual(mockMessage)
      })
    })

    describe('sendTemplateMessage', () => {
      it('should send template message', async () => {
        vi.mocked(provider.sendTemplateMessage).mockResolvedValue(mockMessage)

        const result = await service.sendTemplateMessage(
          'instance-1',
          '+5511999999999',
          'welcome',
          { name: 'John' }
        )

        expect(provider.sendTemplateMessage).toHaveBeenCalledWith(
          'instance-1',
          '+5511999999999',
          'welcome',
          { name: 'John' }
        )
        expect(result).toEqual(mockMessage)
      })

      it('should throw error if provider does not support templates', async () => {
        provider.sendTemplateMessage = undefined

        await expect(
          service.sendTemplateMessage('instance-1', '+5511999999999', 'welcome', {})
        ).rejects.toThrow('does not support templates')
      })
    })

    describe('sendReaction', () => {
      it('should send reaction', async () => {
        vi.mocked(provider.sendReaction).mockResolvedValue(undefined)

        await service.sendReaction('instance-1', '+5511999999999', 'msg-1', '👍')

        expect(provider.sendReaction).toHaveBeenCalledWith(
          'instance-1',
          '+5511999999999',
          'msg-1',
          '👍'
        )
      })
    })

    describe('removeReaction', () => {
      it('should remove reaction', async () => {
        vi.mocked(provider.removeReaction).mockResolvedValue(undefined)

        await service.removeReaction('instance-1', '+5511999999999', 'msg-1')

        expect(provider.removeReaction).toHaveBeenCalledWith(
          'instance-1',
          '+5511999999999',
          'msg-1'
        )
      })
    })
  })

  describe('Groups', () => {
    describe('listGroups', () => {
      it('should return list of groups', async () => {
        vi.mocked(provider.listGroups).mockResolvedValue([mockGroup])

        const result = await service.listGroups('instance-1')

        expect(provider.listGroups).toHaveBeenCalledWith('instance-1')
        expect(result).toEqual([mockGroup])
      })
    })

    describe('getGroup', () => {
      it('should return group by id', async () => {
        vi.mocked(provider.getGroup).mockResolvedValue(mockGroup)

        const result = await service.getGroup('instance-1', 'group-1')

        expect(provider.getGroup).toHaveBeenCalledWith('instance-1', 'group-1')
        expect(result).toEqual(mockGroup)
      })
    })

    describe('createGroup', () => {
      it('should create a group', async () => {
        const payload = { name: 'New Group', participants: ['+5511111111111'] }
        vi.mocked(provider.createGroup).mockResolvedValue(mockGroup)

        const result = await service.createGroup('instance-1', payload)

        expect(provider.createGroup).toHaveBeenCalledWith('instance-1', payload)
        expect(result).toEqual(mockGroup)
      })
    })

    describe('addGroupParticipants', () => {
      it('should add participants to group', async () => {
        vi.mocked(provider.addGroupParticipants).mockResolvedValue(undefined)

        await service.addGroupParticipants('instance-1', 'group-1', ['+5533333333333'])

        expect(provider.addGroupParticipants).toHaveBeenCalledWith(
          'instance-1',
          'group-1',
          ['+5533333333333']
        )
      })
    })

    describe('removeGroupParticipants', () => {
      it('should remove participants from group', async () => {
        vi.mocked(provider.removeGroupParticipants).mockResolvedValue(undefined)

        await service.removeGroupParticipants('instance-1', 'group-1', ['+5522222222222'])

        expect(provider.removeGroupParticipants).toHaveBeenCalledWith(
          'instance-1',
          'group-1',
          ['+5522222222222']
        )
      })
    })

    describe('leaveGroup', () => {
      it('should leave a group', async () => {
        vi.mocked(provider.leaveGroup).mockResolvedValue(undefined)

        await service.leaveGroup('instance-1', 'group-1')

        expect(provider.leaveGroup).toHaveBeenCalledWith('instance-1', 'group-1')
      })
    })
  })

  describe('Webhooks', () => {
    describe('listWebhooks', () => {
      it('should return list of webhooks', async () => {
        vi.mocked(provider.listWebhooks).mockResolvedValue([mockWebhook])

        const result = await service.listWebhooks('instance-1')

        expect(provider.listWebhooks).toHaveBeenCalledWith('instance-1')
        expect(result).toEqual([mockWebhook])
      })
    })

    describe('createWebhook', () => {
      it('should create a webhook', async () => {
        const payload = {
          url: 'https://example.com/webhook',
          events: [WebhookEvent.MESSAGE_RECEIVED],
          name: 'Test Webhook',
        }
        vi.mocked(provider.createWebhook).mockResolvedValue(mockWebhook)

        const result = await service.createWebhook('instance-1', payload)

        expect(provider.createWebhook).toHaveBeenCalledWith('instance-1', payload)
        expect(result).toEqual(mockWebhook)
      })
    })

    describe('deleteWebhook', () => {
      it('should delete a webhook', async () => {
        vi.mocked(provider.deleteWebhook).mockResolvedValue(undefined)

        await service.deleteWebhook('instance-1', 'webhook-1')

        expect(provider.deleteWebhook).toHaveBeenCalledWith('instance-1', 'webhook-1')
      })
    })

    describe('validateWebhookSignature', () => {
      it('should validate webhook signature', () => {
        vi.mocked(provider.validateWebhookSignature).mockReturnValue(true)

        const result = service.validateWebhookSignature('payload', 'signature', 'secret')

        expect(provider.validateWebhookSignature).toHaveBeenCalledWith('payload', 'signature', 'secret')
        expect(result).toBe(true)
      })

      it('should use empty string when secret not provided', () => {
        vi.mocked(provider.validateWebhookSignature).mockReturnValue(false)

        service.validateWebhookSignature('payload', 'signature')

        expect(provider.validateWebhookSignature).toHaveBeenCalledWith('payload', 'signature', '')
      })
    })

    describe('setupDefaultWebhook', () => {
      it('should setup default webhook with all events', async () => {
        vi.mocked(configService.get).mockImplementation((key: string, defaultValue?: string) => {
          if (key === 'WHATSAPP_PROVIDER') return WhatsAppProvider.ZAPSTER
          if (key === 'WEBHOOK_SECRET') return 'secret123'
          return defaultValue
        })
        vi.mocked(provider.createWebhook).mockResolvedValue(mockWebhook)

        await service.setupDefaultWebhook('instance-1', 'https://api.houston.com')

        expect(provider.createWebhook).toHaveBeenCalledWith('instance-1', {
          url: 'https://api.houston.com/api/webhooks/whatsapp/instance-1',
          events: expect.arrayContaining([
            WebhookEvent.MESSAGE_RECEIVED,
            WebhookEvent.MESSAGE_SENT,
            WebhookEvent.MESSAGE_DELIVERED,
            WebhookEvent.MESSAGE_READ,
            WebhookEvent.MESSAGE_FAILED,
            WebhookEvent.CONNECTION_UPDATE,
          ]),
          name: 'Houston IV Webhook',
          secret: 'secret123',
        })
      })
    })
  })

  describe('Utilities', () => {
    describe('verifyNumber', () => {
      it('should verify a phone number', async () => {
        vi.mocked(provider.verifyNumber).mockResolvedValue(true)

        const result = await service.verifyNumber('instance-1', '+5511999999999')

        expect(provider.verifyNumber).toHaveBeenCalledWith('instance-1', '+5511999999999')
        expect(result).toBe(true)
      })
    })

    describe('getContactInfo', () => {
      it('should return contact info', async () => {
        const contactInfo = { name: 'John', profilePicture: 'https://example.com/pic.jpg' }
        vi.mocked(provider.getContactInfo).mockResolvedValue(contactInfo)

        const result = await service.getContactInfo('instance-1', '+5511999999999')

        expect(provider.getContactInfo).toHaveBeenCalledWith('instance-1', '+5511999999999')
        expect(result).toEqual(contactInfo)
      })

      it('should return empty object if provider does not support getContactInfo', async () => {
        provider.getContactInfo = undefined

        const result = await service.getContactInfo('instance-1', '+5511999999999')

        expect(result).toEqual({})
      })
    })

    describe('formatPhoneNumber', () => {
      it('should format phone number', () => {
        vi.mocked(provider.formatPhoneNumber).mockReturnValue('5511999999999')

        const result = service.formatPhoneNumber('+55 11 99999-9999')

        expect(provider.formatPhoneNumber).toHaveBeenCalledWith('+55 11 99999-9999')
        expect(result).toBe('5511999999999')
      })
    })
  })
})
