/**
 * MSW Handlers for Comunicacao module
 */
import { http, HttpResponse } from 'msw';
import {
  ConversationType,
  MessageType,
  MessageStatus,
  ParticipantRole,
  WhatsAppInstanceStatus,
  ShiftOfferStatus,
  type Conversation,
  type Message,
  type Contact,
  type WhatsAppInstance,
  type ShiftOffer,
} from '../../types';

const API_BASE_URL = 'http://localhost:3001/api';

// ============================================================
// Mock Data
// ============================================================

export const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    type: ConversationType.DIRECT,
    name: undefined,
    createdById: 'user-1',
    grupoId: 'grupo-1',
    isArchived: false,
    lastMessageAt: new Date().toISOString(),
    lastMessagePreview: 'Olá, tudo bem?',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    unreadCount: 2,
    participants: [
      {
        id: 'part-1',
        conversationId: 'conv-1',
        phoneNumber: '5511999999999',
        role: ParticipantRole.MEMBER,
        isMuted: false,
        unreadCount: 0,
        joinedAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'conv-2',
    type: ConversationType.GROUP,
    name: 'Grupo Plantões',
    createdById: 'user-1',
    grupoId: 'grupo-1',
    isArchived: false,
    lastMessageAt: new Date().toISOString(),
    lastMessagePreview: 'Alguém disponível para amanhã?',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    unreadCount: 0,
  },
];

export const mockMessages: Message[] = [
  {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'user-1',
    senderPhone: '5511999999999',
    content: 'Olá!',
    messageType: MessageType.TEXT,
    status: MessageStatus.DELIVERED,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'msg-2',
    conversationId: 'conv-1',
    senderId: 'user-2',
    senderPhone: '5511888888888',
    content: 'Tudo bem?',
    messageType: MessageType.TEXT,
    status: MessageStatus.READ,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'msg-3',
    conversationId: 'conv-1',
    senderId: 'user-1',
    senderPhone: '5511999999999',
    content: 'Sim, e você?',
    messageType: MessageType.TEXT,
    status: MessageStatus.SENT,
    createdAt: new Date().toISOString(),
  },
];

export const mockContacts: Contact[] = [
  {
    id: 'contact-1',
    grupoId: 'grupo-1',
    phoneNumber: '5511999999999',
    name: 'Dr. João Silva',
    medicoId: 'medico-1',
    isFavorite: true,
    isBlocked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    medico: {
      id: 'medico-1',
      nome: 'Dr. João Silva',
      especialidade: 'Clinica Geral',
    },
  },
  {
    id: 'contact-2',
    grupoId: 'grupo-1',
    phoneNumber: '5511888888888',
    name: 'Dra. Maria Santos',
    isFavorite: false,
    isBlocked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockWhatsAppInstance: WhatsAppInstance = {
  id: 'instance-1',
  grupoId: 'grupo-1',
  provider: 'zapster',
  providerInstanceId: 'zap-123',
  instanceName: 'WhatsApp Principal',
  status: WhatsAppInstanceStatus.CONNECTED,
  phoneNumber: '5511999999999',
  createdById: 'user-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockShiftOffers: ShiftOffer[] = [
  {
    id: 'offer-1',
    conversationId: 'conv-1',
    messageId: 'msg-4',
    vagaId: 'vaga-1',
    senderUserId: 'user-1',
    recipientMedicoId: 'medico-1',
    status: ShiftOfferStatus.PENDING,
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    vaga: {
      id: 'vaga-1',
      data: new Date().toISOString(),
      horaInicio: '08:00',
      horaFim: '18:00',
      valor: 1500,
      hospital: { nome: 'Hospital Central' },
      setor: { nome: 'UTI' },
    },
  },
];

// ============================================================
// Handlers
// ============================================================

export const comunicacaoHandlers = [
  // ==================== Conversations ====================
  http.get(`${API_BASE_URL}/conversations`, async ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const isArchived = url.searchParams.get('isArchived') === 'true';
    const type = url.searchParams.get('type');
    const search = url.searchParams.get('search');

    let filtered = [...mockConversations];

    if (type) {
      filtered = filtered.filter((c) => c.type === type);
    }
    if (isArchived !== undefined) {
      filtered = filtered.filter((c) => c.isArchived === isArchived);
    }
    if (search) {
      filtered = filtered.filter(
        (c) =>
          c.name?.toLowerCase().includes(search.toLowerCase()) ||
          c.lastMessagePreview?.toLowerCase().includes(search.toLowerCase())
      );
    }

    return HttpResponse.json({
      data: filtered,
      meta: {
        total: filtered.length,
        page,
        limit,
        totalPages: Math.ceil(filtered.length / limit),
        hasNextPage: page * limit < filtered.length,
        hasPrevPage: page > 1,
      },
    });
  }),

  http.get(`${API_BASE_URL}/conversations/:id`, async ({ params }) => {
    const conversation = mockConversations.find((c) => c.id === params.id);

    if (!conversation) {
      return HttpResponse.json(
        { message: 'Conversa não encontrada', statusCode: 404 },
        { status: 404 }
      );
    }

    return HttpResponse.json(conversation);
  }),

  http.post(`${API_BASE_URL}/conversations`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const newConversation: Conversation = {
      id: 'conv-new',
      type: body.type as ConversationType,
      name: body.name as string | undefined,
      createdById: 'user-1',
      grupoId: 'grupo-1',
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json(newConversation, { status: 201 });
  }),

  http.post(`${API_BASE_URL}/conversations/:id/archive`, async ({ params }) => {
    const conversation = mockConversations.find((c) => c.id === params.id);

    if (!conversation) {
      return HttpResponse.json(
        { message: 'Conversa não encontrada', statusCode: 404 },
        { status: 404 }
      );
    }

    return new HttpResponse(null, { status: 204 });
  }),

  http.delete(`${API_BASE_URL}/conversations/:id`, async ({ params }) => {
    const conversation = mockConversations.find((c) => c.id === params.id);

    if (!conversation) {
      return HttpResponse.json(
        { message: 'Conversa não encontrada', statusCode: 404 },
        { status: 404 }
      );
    }

    return new HttpResponse(null, { status: 204 });
  }),

  // ==================== Messages ====================
  http.get(`${API_BASE_URL}/messages/conversation/:conversationId`, async ({ request }) => {
    const url = new URL(request.url);
    const cursor = url.searchParams.get('cursor');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    let messages = [...mockMessages];

    if (cursor) {
      const cursorIndex = messages.findIndex((m) => m.id === cursor);
      if (cursorIndex >= 0) {
        messages = messages.slice(cursorIndex + 1);
      }
    }

    const hasMore = messages.length > limit;
    const data = messages.slice(0, limit);

    return HttpResponse.json({
      data,
      meta: {
        nextCursor: hasMore ? data[data.length - 1]?.id : undefined,
        hasMore,
      },
    });
  }),

  http.post(`${API_BASE_URL}/messages`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const newMessage: Message = {
      id: 'msg-new',
      conversationId: body.conversationId as string,
      senderId: 'user-1',
      senderPhone: '5511999999999',
      content: body.content as string,
      messageType: (body.messageType as MessageType) || MessageType.TEXT,
      status: MessageStatus.SENT,
      createdAt: new Date().toISOString(),
    };

    return HttpResponse.json(newMessage, { status: 201 });
  }),

  http.post(`${API_BASE_URL}/messages/conversation/:conversationId/read`, async () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.delete(`${API_BASE_URL}/messages/:id`, async ({ params }) => {
    const message = mockMessages.find((m) => m.id === params.id);

    if (!message) {
      return HttpResponse.json(
        { message: 'Mensagem não encontrada', statusCode: 404 },
        { status: 404 }
      );
    }

    return new HttpResponse(null, { status: 204 });
  }),

  // ==================== Contacts ====================
  http.get(`${API_BASE_URL}/contacts`, async ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const search = url.searchParams.get('search');
    const isFavorite = url.searchParams.get('isFavorite');
    const isBlocked = url.searchParams.get('isBlocked');

    let filtered = [...mockContacts];

    if (search) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.phoneNumber.includes(search)
      );
    }
    if (isFavorite !== null) {
      filtered = filtered.filter((c) => c.isFavorite === (isFavorite === 'true'));
    }
    if (isBlocked !== null) {
      filtered = filtered.filter((c) => c.isBlocked === (isBlocked === 'true'));
    }

    return HttpResponse.json({
      data: filtered,
      meta: {
        total: filtered.length,
        page,
        limit,
        totalPages: Math.ceil(filtered.length / limit),
        hasNextPage: page * limit < filtered.length,
        hasPrevPage: page > 1,
      },
    });
  }),

  http.get(`${API_BASE_URL}/contacts/:id`, async ({ params }) => {
    const contact = mockContacts.find((c) => c.id === params.id);

    if (!contact) {
      return HttpResponse.json(
        { message: 'Contato não encontrado', statusCode: 404 },
        { status: 404 }
      );
    }

    return HttpResponse.json(contact);
  }),

  http.post(`${API_BASE_URL}/contacts`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const newContact: Contact = {
      id: 'contact-new',
      grupoId: 'grupo-1',
      phoneNumber: body.phoneNumber as string,
      name: body.name as string,
      isFavorite: false,
      isBlocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json(newContact, { status: 201 });
  }),

  http.patch(`${API_BASE_URL}/contacts/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const contact = mockContacts.find((c) => c.id === params.id);

    if (!contact) {
      return HttpResponse.json(
        { message: 'Contato não encontrado', statusCode: 404 },
        { status: 404 }
      );
    }

    return HttpResponse.json({ ...contact, ...body, updatedAt: new Date().toISOString() });
  }),

  http.delete(`${API_BASE_URL}/contacts/:id`, async ({ params }) => {
    const contact = mockContacts.find((c) => c.id === params.id);

    if (!contact) {
      return HttpResponse.json(
        { message: 'Contato não encontrado', statusCode: 404 },
        { status: 404 }
      );
    }

    return new HttpResponse(null, { status: 204 });
  }),

  // ==================== WhatsApp ====================
  http.get(`${API_BASE_URL}/whatsapp/instances/grupo/:grupoId`, async ({ params }) => {
    if (params.grupoId === 'grupo-1') {
      return HttpResponse.json(mockWhatsAppInstance);
    }
    return HttpResponse.json(null);
  }),

  http.get(`${API_BASE_URL}/whatsapp/instances/:id`, async ({ params }) => {
    if (params.id === mockWhatsAppInstance.id) {
      return HttpResponse.json(mockWhatsAppInstance);
    }
    return HttpResponse.json(
      { message: 'Instância não encontrada', statusCode: 404 },
      { status: 404 }
    );
  }),

  http.post(`${API_BASE_URL}/whatsapp/instances`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const newInstance: WhatsAppInstance = {
      id: 'instance-new',
      grupoId: (body.grupoId as string) || 'grupo-1',
      provider: 'zapster',
      providerInstanceId: 'zap-new',
      instanceName: body.instanceName as string,
      status: WhatsAppInstanceStatus.DISCONNECTED,
      createdById: 'user-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json(newInstance, { status: 201 });
  }),

  http.post(`${API_BASE_URL}/whatsapp/instances/:id/connect`, async () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${API_BASE_URL}/whatsapp/instances/:id/disconnect`, async () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.delete(`${API_BASE_URL}/whatsapp/instances/:id`, async ({ params }) => {
    if (params.id === mockWhatsAppInstance.id || params.id === 'instance-new') {
      return new HttpResponse(null, { status: 204 });
    }
    return HttpResponse.json(
      { message: 'Instância não encontrada', statusCode: 404 },
      { status: 404 }
    );
  }),

  http.get(`${API_BASE_URL}/whatsapp/instances/:id/qr`, async () => {
    return HttpResponse.json({
      qr: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      expiresAt: new Date(Date.now() + 60000).toISOString(),
    });
  }),

  http.post(`${API_BASE_URL}/whatsapp/instances/:id/pairing-code`, async () => {
    return HttpResponse.json({
      code: 'ABC-12345',
      expiresAt: new Date(Date.now() + 300000).toISOString(),
    });
  }),

  http.get(`${API_BASE_URL}/whatsapp/instances/:id/status`, async ({ params }) => {
    if (params.id === mockWhatsAppInstance.id) {
      return HttpResponse.json({
        status: WhatsAppInstanceStatus.CONNECTED,
        phoneNumber: '5511999999999',
        isConnected: true,
      });
    }
    return HttpResponse.json({
      status: WhatsAppInstanceStatus.DISCONNECTED,
      isConnected: false,
    });
  }),

  http.post(`${API_BASE_URL}/whatsapp/instances/:id/restart`, async () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // ==================== Shift Offers ====================
  http.get(`${API_BASE_URL}/shift-offers`, async ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const status = url.searchParams.get('status');

    let filtered = [...mockShiftOffers];

    if (status) {
      filtered = filtered.filter((o) => o.status === status);
    }

    return HttpResponse.json({
      data: filtered,
      meta: {
        total: filtered.length,
        page,
        limit,
        totalPages: Math.ceil(filtered.length / limit),
        hasNextPage: page * limit < filtered.length,
        hasPrevPage: page > 1,
      },
    });
  }),

  http.get(`${API_BASE_URL}/shift-offers/:id`, async ({ params }) => {
    const offer = mockShiftOffers.find((o) => o.id === params.id);

    if (!offer) {
      return HttpResponse.json(
        { message: 'Oferta não encontrada', statusCode: 404 },
        { status: 404 }
      );
    }

    return HttpResponse.json(offer);
  }),

  http.post(`${API_BASE_URL}/shift-offers`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const newOffer: ShiftOffer = {
      id: 'offer-new',
      conversationId: body.conversationId as string,
      vagaId: body.vagaId as string,
      senderUserId: 'user-1',
      recipientMedicoId: body.recipientMedicoId as string,
      status: ShiftOfferStatus.PENDING,
      expiresAt: new Date(Date.now() + (body.expiresInHours as number || 24) * 3600000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    return HttpResponse.json(newOffer, { status: 201 });
  }),

  http.post(`${API_BASE_URL}/shift-offers/:id/respond`, async ({ params, request }) => {
    const body = (await request.json()) as { action: 'accept' | 'reject' };
    const offer = mockShiftOffers.find((o) => o.id === params.id);

    if (!offer) {
      return HttpResponse.json(
        { message: 'Oferta não encontrada', statusCode: 404 },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      ...offer,
      status: body.action === 'accept' ? ShiftOfferStatus.ACCEPTED : ShiftOfferStatus.REJECTED,
      respondedAt: new Date().toISOString(),
    });
  }),

  http.delete(`${API_BASE_URL}/shift-offers/:id`, async ({ params }) => {
    const offer = mockShiftOffers.find((o) => o.id === params.id);

    if (!offer) {
      return HttpResponse.json(
        { message: 'Oferta não encontrada', statusCode: 404 },
        { status: 404 }
      );
    }

    return new HttpResponse(null, { status: 204 });
  }),
];
