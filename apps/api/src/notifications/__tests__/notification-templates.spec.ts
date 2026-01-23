import { describe, it, expect } from 'vitest'
import { buildEmailHtml, buildPlainText } from '../templates/base-template'
import { buildNotificationTemplate } from '../templates/notification-templates'

describe('Email Templates', () => {
  describe('buildEmailHtml', () => {
    it('should build basic HTML email', () => {
      const html = buildEmailHtml({
        title: 'Test Title',
        content: 'Test content message',
      })

      expect(html).toContain('Test Title')
      expect(html).toContain('Test content message')
      expect(html).toContain('Houston')
      expect(html).toContain('<!DOCTYPE html>')
    })

    it('should include recipient name when provided', () => {
      const html = buildEmailHtml({
        title: 'Test Title',
        content: 'Test content',
        recipientName: 'John Doe',
      })

      expect(html).toContain('Olá, John Doe!')
    })

    it('should include action button when URL provided', () => {
      const html = buildEmailHtml({
        title: 'Test Title',
        content: 'Test content',
        actionUrl: 'https://example.com/action',
        actionText: 'Click Here',
      })

      expect(html).toContain('https://example.com/action')
      expect(html).toContain('Click Here')
    })
  })

  describe('buildPlainText', () => {
    it('should build plain text email', () => {
      const text = buildPlainText({
        title: 'Test Title',
        content: 'Test content message',
      })

      expect(text).toContain('Olá!')
      expect(text).toContain('Test Title')
      expect(text).toContain('Test content message')
    })

    it('should include action URL in plain text', () => {
      const text = buildPlainText({
        title: 'Test Title',
        content: 'Test content',
        actionUrl: 'https://example.com',
      })

      expect(text).toContain('Acesse: https://example.com')
    })
  })

  describe('buildNotificationTemplate', () => {
    it('should build ticket_created template', () => {
      const template = buildNotificationTemplate({
        type: 'ticket_created' as const,
        recipientName: 'João',
        data: { ticketId: '123', ticketTitle: 'Bug no login' },
        baseUrl: 'https://houston.com',
      })

      expect(template.subject).toBe('Novo ticket criado')
      expect(template.html).toContain('João')
      expect(template.html).toContain('Bug no login')
      expect(template.html).toContain('https://houston.com/tickets/123')
    })

    it('should build ticket_sla_warning template', () => {
      const template = buildNotificationTemplate({
        type: 'ticket_sla_warning' as const,
        data: { ticketId: '456', hoursRemaining: 2 },
      })

      expect(template.subject).toContain('Alerta de SLA')
      expect(template.html).toContain('2 horas')
    })

    it('should build candidatura_approved template', () => {
      const template = buildNotificationTemplate({
        type: 'candidatura_approved' as const,
        recipientName: 'Dr. Silva',
      })

      expect(template.subject).toContain('aprovada')
      expect(template.html).toContain('Dr. Silva')
      expect(template.html).toContain('Parabéns')
    })

    it('should build comunicado_published template', () => {
      const template = buildNotificationTemplate({
        type: 'comunicado_published' as const,
        data: { titulo: 'Aviso Importante', comunicadoId: '789' },
        baseUrl: 'https://houston.com',
      })

      expect(template.subject).toContain('Aviso Importante')
      expect(template.html).toContain('https://houston.com/comunicados/789')
    })

    it('should handle unknown notification type', () => {
      const template = buildNotificationTemplate({
        type: 'unknown_type' as any,
      })

      expect(template.subject).toBe('Notificação do Houston')
      expect(template.html).toContain('Nova Notificação')
    })
  })
})
