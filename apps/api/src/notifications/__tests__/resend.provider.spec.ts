import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ResendProvider } from '../providers/resend.provider'

describe('ResendProvider', () => {
  describe('when RESEND_API_KEY is not configured', () => {
    let provider: ResendProvider

    beforeEach(() => {
      delete process.env.RESEND_API_KEY
      provider = new ResendProvider()
    })

    it('should be disabled', () => {
      expect((provider as any).isEnabled).toBe(false)
      expect((provider as any).resend).toBeNull()
    })

    it('should return false when trying to send email', async () => {
      const result = await provider.sendEmail({
        to: 'test@test.com',
        subject: 'Test',
        html: '<p>Test</p>',
      })

      expect(result).toBe(false)
    })

    it('should return false for templated notification', async () => {
      const result = await provider.sendTemplatedNotification({
        to: 'test@test.com',
        type: 'ticket_created' as any,
      })

      expect(result).toBe(false)
    })

    it('should return false for notification email', async () => {
      const result = await provider.sendNotificationEmail(
        'test@test.com',
        'Title',
        'Content',
      )

      expect(result).toBe(false)
    })

    it('should handle bulk emails when disabled', async () => {
      const result = await provider.sendBulkEmails([
        { email: 'test@test.com', title: 'Test', content: 'Content' },
      ])

      expect(result).toEqual({ success: 0, failed: 1 })
    })
  })

  describe('buildNotificationEmailHtml', () => {
    let provider: ResendProvider

    beforeEach(() => {
      provider = new ResendProvider()
    })

    it('should build HTML with action button', () => {
      const html = (provider as any).buildNotificationEmailHtml(
        'Test Title',
        'Test content',
        'https://example.com/action',
      )

      expect(html).toContain('Test Title')
      expect(html).toContain('Test content')
      expect(html).toContain('https://example.com/action')
      expect(html).toContain('Ver Detalhes')
      expect(html).toContain('Houston')
    })

    it('should build HTML without action button', () => {
      const html = (provider as any).buildNotificationEmailHtml(
        'Test Title',
        'Test content',
      )

      expect(html).toContain('Test Title')
      expect(html).toContain('Test content')
      expect(html).not.toContain('Ver Detalhes')
    })
  })

  describe('default configuration', () => {
    let provider: ResendProvider

    beforeEach(() => {
      delete process.env.RESEND_FROM_EMAIL
      provider = new ResendProvider()
    })

    it('should use default from email', () => {
      expect((provider as any).fromEmail).toBe('noreply@houston.com.br')
    })
  })
})
