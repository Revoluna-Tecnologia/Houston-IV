import {
  buildEmailHtml,
  buildPlainText,
  EmailTemplateData,
} from "./base-template";
import { NotificationType } from "../../generated/prisma/client";

interface NotificationTemplateInput {
  type: NotificationType;
  recipientName?: string;
  data?: Record<string, unknown>;
  baseUrl?: string;
}

interface NotificationTemplate {
  subject: string;
  html: string;
  text: string;
}

const TEMPLATE_CONFIG: Record<
  string,
  {
    subject: string | ((data?: Record<string, unknown>) => string);
    content: string | ((data?: Record<string, unknown>) => string);
    actionText?: string;
    getActionUrl?: (
      data?: Record<string, unknown>,
      baseUrl?: string,
    ) => string | undefined;
  }
> = {
  ticket_created: {
    subject: "Novo ticket criado",
    content: (data) =>
      `Um novo ticket foi criado${data?.ticketTitle ? `: "${data.ticketTitle}"` : ""}. Acesse o sistema para ver os detalhes e tomar as ações necessárias.`,
    actionText: "Ver Ticket",
    getActionUrl: (data, baseUrl) =>
      data?.ticketId ? `${baseUrl}/tickets/${data.ticketId}` : undefined,
  },
  ticket_assigned: {
    subject: "Ticket atribuído a você",
    content: (data) =>
      `Você foi atribuído ao ticket${data?.ticketTitle ? ` "${data.ticketTitle}"` : ""}. Por favor, verifique os detalhes e inicie o atendimento.`,
    actionText: "Ver Ticket",
    getActionUrl: (data, baseUrl) =>
      data?.ticketId ? `${baseUrl}/tickets/${data.ticketId}` : undefined,
  },
  ticket_status_changed: {
    subject: (data) =>
      `Status do ticket alterado para ${data?.newStatus || "novo status"}`,
    content: (data) =>
      `O status do seu ticket${data?.ticketTitle ? ` "${data.ticketTitle}"` : ""} foi alterado${data?.oldStatus && data?.newStatus ? ` de "${data.oldStatus}" para "${data.newStatus}"` : ""}.`,
    actionText: "Ver Ticket",
    getActionUrl: (data, baseUrl) =>
      data?.ticketId ? `${baseUrl}/tickets/${data.ticketId}` : undefined,
  },
  ticket_comment_added: {
    subject: "Novo comentário no ticket",
    content: (data) =>
      `${data?.authorName || "Alguém"} adicionou um comentário ao ticket${data?.ticketTitle ? ` "${data.ticketTitle}"` : ""}.`,
    actionText: "Ver Comentário",
    getActionUrl: (data, baseUrl) =>
      data?.ticketId ? `${baseUrl}/tickets/${data.ticketId}` : undefined,
  },
  ticket_sla_warning: {
    subject: "⚠️ Alerta de SLA - Ticket próximo do prazo",
    content: (data) =>
      `Atenção! O ticket${data?.ticketTitle ? ` "${data.ticketTitle}"` : ""} está próximo de exceder o prazo de SLA. ${data?.hoursRemaining ? `Restam aproximadamente ${data.hoursRemaining} horas.` : ""} Por favor, priorize este atendimento.`,
    actionText: "Ver Ticket Urgente",
    getActionUrl: (data, baseUrl) =>
      data?.ticketId ? `${baseUrl}/tickets/${data.ticketId}` : undefined,
  },
  ticket_sla_breach: {
    subject: "🚨 SLA Violado - Ação imediata necessária",
    content: (data) =>
      `O ticket${data?.ticketTitle ? ` "${data.ticketTitle}"` : ""} excedeu o prazo de SLA. É necessária ação imediata para resolver esta situação.`,
    actionText: "Ver Ticket",
    getActionUrl: (data, baseUrl) =>
      data?.ticketId ? `${baseUrl}/tickets/${data.ticketId}` : undefined,
  },
  vaga_created: {
    subject: "Nova vaga criada",
    content:
      "Uma nova vaga foi criada com sucesso no sistema. Você pode acompanhar as candidaturas pelo painel.",
    actionText: "Ver Vaga",
    getActionUrl: (data, baseUrl) =>
      data?.vagaId ? `${baseUrl}/vagas/${data.vagaId}` : undefined,
  },
  vaga_expiring: {
    subject: "⚠️ Vaga próxima de expirar",
    content: (data) =>
      `Uma vaga está próxima de expirar${data?.hoursRemaining ? ` (${data.hoursRemaining}h restantes)` : ""} e ainda não possui médicos confirmados. Verifique as candidaturas ou considere estender o prazo.`,
    actionText: "Ver Vaga",
    getActionUrl: (data, baseUrl) =>
      data?.vagaId ? `${baseUrl}/vagas/${data.vagaId}` : undefined,
  },
  vaga_no_candidates: {
    subject: "🚨 Vaga sem candidatos",
    content:
      "Uma vaga está próxima do horário de início e ainda não possui candidatos. Considere tomar ações para preencher esta posição.",
    actionText: "Ver Vaga",
    getActionUrl: (data, baseUrl) =>
      data?.vagaId ? `${baseUrl}/vagas/${data.vagaId}` : undefined,
  },
  candidatura_received: {
    subject: "Nova candidatura recebida",
    content: (data) =>
      `${data?.medicoName || "Um médico"} se candidatou para uma vaga. Avalie a candidatura e tome uma decisão.`,
    actionText: "Ver Candidatura",
    getActionUrl: (data, baseUrl) =>
      data?.vagaId ? `${baseUrl}/vagas/${data.vagaId}` : undefined,
  },
  candidatura_approved: {
    subject: "✅ Sua candidatura foi aprovada!",
    content:
      "Parabéns! Sua candidatura foi aprovada. Acesse o sistema para ver os detalhes do plantão.",
    actionText: "Ver Detalhes",
    getActionUrl: (data, baseUrl) =>
      data?.vagaId ? `${baseUrl}/vagas/${data.vagaId}` : undefined,
  },
  candidatura_rejected: {
    subject: "Atualização sobre sua candidatura",
    content: (data) =>
      `Infelizmente sua candidatura não foi aprovada neste momento.${data?.reason ? ` Motivo: ${data.reason}` : ""} Você pode continuar se candidatando para outras vagas.`,
    actionText: "Ver Outras Vagas",
    getActionUrl: (data, baseUrl) => `${baseUrl}/vagas`,
  },
  medico_registered: {
    subject: "Cadastro recebido com sucesso",
    content:
      "Seu cadastro foi recebido e está em análise. Você receberá uma notificação assim que for aprovado.",
    actionText: "Ver Status",
    getActionUrl: (data, baseUrl) => `${baseUrl}/perfil`,
  },
  medico_approved: {
    subject: "✅ Cadastro aprovado!",
    content:
      "Seu cadastro foi aprovado! Agora você pode acessar todas as funcionalidades do sistema e se candidatar a vagas.",
    actionText: "Acessar Sistema",
    getActionUrl: (data, baseUrl) => baseUrl,
  },
  comunicado_published: {
    subject: (data) => `Novo comunicado: ${data?.titulo || "Importante"}`,
    content: (data) =>
      (data?.content as string) ||
      "Um novo comunicado foi publicado. Acesse o sistema para ver os detalhes.",
    actionText: "Ver Comunicado",
    getActionUrl: (data, baseUrl) =>
      data?.comunicadoId
        ? `${baseUrl}/comunicados/${data.comunicadoId}`
        : undefined,
  },
  checkin_reminder: {
    subject: "⏰ Lembrete de Check-in",
    content:
      "Seu plantão começa em breve. Não esqueça de fazer o check-in ao chegar no local.",
    actionText: "Fazer Check-in",
    getActionUrl: (data, baseUrl) => `${baseUrl}/checkin`,
  },
  checkout_reminder: {
    subject: "⏰ Lembrete de Check-out",
    content: "Não esqueça de fazer o check-out ao finalizar seu plantão.",
    actionText: "Fazer Check-out",
    getActionUrl: (data, baseUrl) => `${baseUrl}/checkin`,
  },
  checkin_late: {
    subject: "⚠️ Check-in atrasado",
    content: (data) =>
      `O check-in está atrasado${data?.minutesLate ? ` em ${data.minutesLate} minutos` : ""}. Por favor, verifique a situação.`,
    actionText: "Ver Detalhes",
    getActionUrl: (data, baseUrl) => `${baseUrl}/checkin`,
  },
  message_received: {
    subject: "Nova mensagem recebida",
    content: (data) =>
      `${data?.senderName || "Alguém"} enviou uma mensagem para você.`,
    actionText: "Ver Mensagem",
    getActionUrl: (data, baseUrl) => `${baseUrl}/comunicacao`,
  },
  shift_offer_received: {
    subject: "📋 Nova oferta de plantão",
    content:
      "Você recebeu uma nova oferta de plantão. Acesse o sistema para ver os detalhes e responder.",
    actionText: "Ver Oferta",
    getActionUrl: (data, baseUrl) =>
      data?.vagaId
        ? `${baseUrl}/vagas/${data.vagaId}`
        : `${baseUrl}/comunicacao`,
  },
};

export function buildNotificationTemplate(
  input: NotificationTemplateInput,
): NotificationTemplate {
  const {
    type,
    recipientName,
    data,
    baseUrl = process.env.FRONTEND_URL || "http://localhost:3000",
  } = input;

  const config = TEMPLATE_CONFIG[type];

  if (!config) {
    return {
      subject: "Notificação do Houston",
      html: buildEmailHtml({
        title: "Nova Notificação",
        content: "Você tem uma nova notificação no sistema Houston.",
        recipientName,
        actionUrl: baseUrl,
        actionText: "Acessar Sistema",
      }),
      text: buildPlainText({
        title: "Nova Notificação",
        content: "Você tem uma nova notificação no sistema Houston.",
        recipientName,
        actionUrl: baseUrl,
      }),
    };
  }

  const subject =
    typeof config.subject === "function"
      ? config.subject(data)
      : config.subject;
  const content =
    typeof config.content === "function"
      ? config.content(data)
      : config.content;
  const actionUrl = config.getActionUrl?.(data, baseUrl);

  const templateData: EmailTemplateData = {
    title: subject,
    content,
    recipientName,
    actionUrl,
    actionText: config.actionText,
  };

  return {
    subject,
    html: buildEmailHtml(templateData),
    text: buildPlainText(templateData),
  };
}
