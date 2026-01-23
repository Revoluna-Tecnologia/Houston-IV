export interface EmailTemplateData {
  title: string
  content: string
  actionUrl?: string
  actionText?: string
  recipientName?: string
  footer?: string
}

export function buildEmailHtml(data: EmailTemplateData): string {
  const { title, content, actionUrl, actionText = 'Ver Detalhes', recipientName, footer } = data

  const greeting = recipientName ? `Olá, ${recipientName}!` : 'Olá!'

  const actionButton = actionUrl
    ? `
      <tr>
        <td style="padding: 24px 0;">
          <a href="${actionUrl}"
             style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
            ${actionText}
          </a>
        </td>
      </tr>
    `
    : ''

  const footerText = footer || 'Esta é uma notificação automática do sistema Houston. Por favor, não responda a este email.'

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media only screen and (max-width: 620px) {
      .container { width: 100% !important; padding: 0 16px !important; }
      .content { padding: 24px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%); padding: 32px; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Houston</h1>
                    <p style="margin: 8px 0 0; color: #a1a1aa; font-size: 14px;">Sistema de Gestão Médica</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="content" style="padding: 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin: 0 0 16px; color: #52525b; font-size: 16px; line-height: 1.5;">
                      ${greeting}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td>
                    <h2 style="margin: 0 0 16px; color: #18181b; font-size: 22px; font-weight: 600; line-height: 1.3;">
                      ${title}
                    </h2>
                  </td>
                </tr>
                <tr>
                  <td>
                    <p style="margin: 0; color: #52525b; font-size: 16px; line-height: 1.6;">
                      ${content}
                    </p>
                  </td>
                </tr>
                ${actionButton}
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 0;">
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px 32px; text-align: center;">
              <p style="margin: 0 0 16px; color: #71717a; font-size: 13px; line-height: 1.5;">
                ${footerText}
              </p>
              <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
                &copy; ${new Date().getFullYear()} Houston. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

export function buildPlainText(data: EmailTemplateData): string {
  const { title, content, actionUrl, recipientName } = data
  const greeting = recipientName ? `Olá, ${recipientName}!` : 'Olá!'

  let text = `${greeting}\n\n${title}\n\n${content}`

  if (actionUrl) {
    text += `\n\nAcesse: ${actionUrl}`
  }

  text += '\n\n---\nEsta é uma notificação automática do sistema Houston.'

  return text
}
