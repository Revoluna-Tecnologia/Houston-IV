import { Injectable, Logger } from "@nestjs/common";
import { Resend } from "resend";
import { NotificationType } from "../../generated/prisma/client";
import { buildNotificationTemplate } from "../templates";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface SendTemplatedNotificationOptions {
  to: string;
  type: NotificationType;
  recipientName?: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class ResendProvider {
  private readonly logger = new Logger(ResendProvider.name);
  private readonly resend: Resend | null;
  private readonly fromEmail: string;
  private readonly isEnabled: boolean;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@houston.com.br";
    this.isEnabled = !!apiKey;

    if (this.isEnabled) {
      this.resend = new Resend(apiKey);
      this.logger.log("ResendProvider initialized");
    } else {
      this.resend = null;
      this.logger.warn(
        "ResendProvider disabled: RESEND_API_KEY not configured",
      );
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    if (!this.isEnabled || !this.resend) {
      this.logger.debug("Email not sent: Resend is disabled");
      return false;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
      });

      if (error) {
        this.logger.error(`Failed to send email: ${error.message}`);
        return false;
      }

      this.logger.debug(`Email sent successfully: ${data?.id}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending email: ${error}`);
      return false;
    }
  }

  async sendTemplatedNotification(
    options: SendTemplatedNotificationOptions,
  ): Promise<boolean> {
    const template = buildNotificationTemplate({
      type: options.type,
      recipientName: options.recipientName,
      data: options.data,
    });

    return this.sendEmail({
      to: options.to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendNotificationEmail(
    to: string,
    title: string,
    content: string,
    actionUrl?: string,
  ): Promise<boolean> {
    const html = this.buildNotificationEmailHtml(title, content, actionUrl);
    return this.sendEmail({
      to,
      subject: title,
      html,
      text: content,
    });
  }

  async sendBulkEmails(
    recipients: { email: string; title: string; content: string }[],
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const recipient of recipients) {
      const sent = await this.sendNotificationEmail(
        recipient.email,
        recipient.title,
        recipient.content,
      );
      if (sent) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  }

  async sendBulkTemplatedNotifications(
    recipients: SendTemplatedNotificationOptions[],
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const recipient of recipients) {
      const sent = await this.sendTemplatedNotification(recipient);
      if (sent) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  }

  private buildNotificationEmailHtml(
    title: string,
    content: string,
    actionUrl?: string,
  ): string {
    const actionButton = actionUrl
      ? `<a href="${actionUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;margin-top:16px;">Ver Detalhes</a>`
      : "";

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background:#18181b;padding:24px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:24px;font-weight:600;">Houston</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 16px;color:#18181b;font-size:20px;font-weight:600;">${title}</h2>
              <p style="margin:0;color:#52525b;font-size:16px;line-height:1.6;">${content}</p>
              ${actionButton}
            </td>
          </tr>
          <tr>
            <td style="padding:24px;background:#f4f4f5;text-align:center;">
              <p style="margin:0;color:#71717a;font-size:14px;">
                Esta e uma notificacao automatica do sistema Houston.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}
