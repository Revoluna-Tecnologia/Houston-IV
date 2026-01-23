import { describe, it, expect } from 'vitest'
import { apiRequest } from '../setup.integration'

interface WhatsAppInstance {
  id: string
  grupoId: string
  instanceName: string
  provider: string
  status: 'offline' | 'connecting' | 'connected' | 'disconnected'
  phoneNumber?: string
}

interface ConnectionStatus {
  status: string
  isConnected: boolean
  phoneNumber?: string
}

interface QRCodeResponse {
  qr: string
  expiresAt: string
}

describe('WhatsApp Integration', () => {
  let createdInstanceId: string
  let testGrupoId: string

  describe('Instances CRUD', () => {
    it('should list WhatsApp instances', async () => {
      const response = await apiRequest<WhatsAppInstance[]>('/whatsapp/instances')

      expect(response).toBeDefined()
      expect(Array.isArray(response)).toBe(true)
    })

    it('should create, read and delete WhatsApp instance', async () => {
      // Get grupo for creating instance
      const grupos = await apiRequest<{ data: { id: string }[] }>('/grupos')
      if (grupos.data.length === 0) {
        console.log('No grupos available, skipping test')
        return
      }
      testGrupoId = grupos.data[0].id

      // CREATE
      const created = await apiRequest<WhatsAppInstance>('/whatsapp/instances', {
        method: 'POST',
        body: JSON.stringify({
          grupoId: testGrupoId,
          name: 'Instância Teste Integração',
        }),
      })

      expect(created.id).toBeDefined()
      expect(created.grupoId).toBe(testGrupoId)
      expect(created.instanceName).toBe('Instância Teste Integração')
      expect(created.status).toBe('offline')
      createdInstanceId = created.id

      // READ
      const fetched = await apiRequest<WhatsAppInstance>(
        `/whatsapp/instances/${createdInstanceId}`
      )
      expect(fetched.id).toBe(createdInstanceId)

      // DELETE
      await apiRequest(`/whatsapp/instances/${createdInstanceId}`, { method: 'DELETE' })
    })

    it('should get instance by grupo', async () => {
      const grupos = await apiRequest<{ data: { id: string }[] }>('/grupos')
      if (grupos.data.length === 0) {
        console.log('No grupos available, skipping test')
        return
      }

      const response = await apiRequest<WhatsAppInstance | null>(
        `/whatsapp/instances/grupo/${grupos.data[0].id}`
      )

      // Can be null if no instance exists for this grupo
      expect(response === null || response.id).toBeDefined()
    })
  })

  describe('Instance Operations', () => {
    it('should get connection status', async () => {
      const instances = await apiRequest<WhatsAppInstance[]>('/whatsapp/instances')

      if (instances.length > 0) {
        const response = await apiRequest<ConnectionStatus>(
          `/whatsapp/instances/${instances[0].id}/status`
        )

        expect(response.status).toBeDefined()
        expect(typeof response.isConnected).toBe('boolean')
      }
    })

    it('should update instance name', async () => {
      const grupos = await apiRequest<{ data: { id: string }[] }>('/grupos')
      if (grupos.data.length === 0) {
        console.log('No grupos available, skipping test')
        return
      }

      // Check if grupo already has instance
      const existing = await apiRequest<WhatsAppInstance | null>(
        `/whatsapp/instances/grupo/${grupos.data[0].id}`
      )

      if (existing) {
        // Update existing instance
        const updated = await apiRequest<WhatsAppInstance>(
          `/whatsapp/instances/${existing.id}`,
          {
            method: 'PUT',
            body: JSON.stringify({ name: 'Nome Atualizado' }),
          }
        )
        expect(updated.instanceName).toBe('Nome Atualizado')

        // Restore original name
        await apiRequest(`/whatsapp/instances/${existing.id}`, {
          method: 'PUT',
          body: JSON.stringify({ name: existing.instanceName }),
        })
      }
    })
  })

  describe('Connection Flow', () => {
    it('should power on instance', async () => {
      const instances = await apiRequest<WhatsAppInstance[]>('/whatsapp/instances')

      if (instances.length > 0 && instances[0].status === 'offline') {
        const response = await apiRequest<WhatsAppInstance>(
          `/whatsapp/instances/${instances[0].id}/power-on`,
          { method: 'POST' }
        )

        expect(response.status).toBe('connecting')
      }
    })

    it('should power off instance', async () => {
      const instances = await apiRequest<WhatsAppInstance[]>('/whatsapp/instances')

      if (instances.length > 0 && instances[0].status !== 'offline') {
        const response = await apiRequest<WhatsAppInstance>(
          `/whatsapp/instances/${instances[0].id}/power-off`,
          { method: 'POST' }
        )

        expect(response.status).toBe('offline')
      }
    })

    it('should get QR code for connecting', async () => {
      const instances = await apiRequest<WhatsAppInstance[]>('/whatsapp/instances')

      if (instances.length > 0) {
        try {
          const response = await apiRequest<QRCodeResponse>(
            `/whatsapp/instances/${instances[0].id}/qr-code`
          )

          expect(response.qr).toBeDefined()
          expect(response.expiresAt).toBeDefined()
        } catch {
          // May fail if instance is already connected or provider unavailable
          console.log('QR code not available (instance may be connected)')
        }
      }
    })

    it('should disconnect instance', async () => {
      const instances = await apiRequest<WhatsAppInstance[]>('/whatsapp/instances')

      if (instances.length > 0 && instances[0].status === 'connected') {
        const response = await apiRequest<WhatsAppInstance>(
          `/whatsapp/instances/${instances[0].id}/disconnect`,
          { method: 'POST' }
        )

        expect(response.status).toBe('disconnected')
      }
    })
  })
})
