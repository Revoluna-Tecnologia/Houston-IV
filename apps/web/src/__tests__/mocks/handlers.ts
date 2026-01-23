import { http, HttpResponse } from 'msw';

const API_BASE_URL = 'http://localhost:3001/api';

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  nome: 'Test User',
  role: 'administrador',
  grupoIds: ['grupo-1'],
  ativo: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};


const mockHospitals = [
  {
    id: 'hospital-1',
    nome: 'Hospital Central',
    grupoId: 'grupo-1',
    cnpj: '12.345.678/0001-90',
    endereco: 'Rua Principal, 123',
    cidade: 'Sao Paulo',
    estado: 'SP',
    cep: '01234-567',
    telefone: '(11) 1234-5678',
    email: 'contato@hospitalcentral.com',
    ativo: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'hospital-2',
    nome: 'Hospital Norte',
    grupoId: 'grupo-1',
    cnpj: '98.765.432/0001-10',
    endereco: 'Av. Norte, 456',
    cidade: 'Sao Paulo',
    estado: 'SP',
    cep: '02345-678',
    telefone: '(11) 9876-5432',
    email: 'contato@hospitalnorte.com',
    ativo: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockVagas = [
  {
    id: 'vaga-1',
    data: new Date().toISOString(),
    horaInicio: '08:00',
    horaFim: '18:00',
    valor: 1500,
    observacoes: 'Plantao diurno',
    status: 'aberta',
    hospitalId: 'hospital-1',
    setorId: 'setor-1',
    especialidadeId: 'especialidade-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'vaga-2',
    data: new Date().toISOString(),
    horaInicio: '18:00',
    horaFim: '08:00',
    valor: 2000,
    observacoes: 'Plantao noturno',
    status: 'fechada',
    hospitalId: 'hospital-2',
    setorId: 'setor-2',
    especialidadeId: 'especialidade-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockMedicos = [
  {
    id: 'medico-1',
    nome: 'Dr. Joao Silva',
    crm: '123456',
    crmUf: 'SP',
    especialidadeId: 'especialidade-1',
    cpf: '123.456.789-00',
    email: 'joao@email.com',
    telefone: '(11) 99999-9999',
    ativo: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockCandidaturas = [
  {
    id: 'candidatura-1',
    vagaId: 'vaga-1',
    medicoId: 'medico-1',
    status: 'pendente',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockGrades = [
  {
    id: 'grade-1',
    nome: 'Grade Janeiro 2025',
    hospitalId: 'hospital-1',
    setorId: 'setor-1',
    mes: 1,
    ano: 2025,
    status: 'rascunho',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockPagamentos = [
  {
    id: 'pagamento-1',
    vagaId: 'vaga-1',
    medicoId: 'medico-1',
    valor: 1500,
    status: 'pendente',
    dataAutorizacao: null,
    dataPagamento: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Better Auth endpoints (now pointing to NestJS API)
const BETTER_AUTH_BASE_URL = 'http://localhost:3001/api/auth';

export const handlers = [
  // Better Auth endpoints
  http.post(`${BETTER_AUTH_BASE_URL}/sign-in/email`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };

    if (body.email === 'invalid@example.com') {
      return HttpResponse.json(
        { error: { message: 'Credenciais invalidas', code: 'INVALID_CREDENTIALS' } },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      data: {
        user: mockUser,
        session: {
          id: 'session-1',
          userId: mockUser.id,
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        },
      },
    });
  }),

  http.post(`${BETTER_AUTH_BASE_URL}/sign-up/email`, async () => {
    return HttpResponse.json({
      data: {
        user: mockUser,
        session: {
          id: 'session-1',
          userId: mockUser.id,
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        },
      },
    });
  }),

  http.post(`${BETTER_AUTH_BASE_URL}/sign-out`, async () => {
    return new HttpResponse(null, { status: 200 });
  }),

  http.get(`${BETTER_AUTH_BASE_URL}/get-session`, async ({ request }) => {
    const cookies = request.headers.get('cookie');
    
    if (!cookies || !cookies.includes('better-auth.session_token')) {
      return HttpResponse.json({ data: { user: null, session: null } });
    }

    return HttpResponse.json({
      data: {
        user: mockUser,
        session: {
          id: 'session-1',
          userId: mockUser.id,
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        },
      },
    });
  }),

  http.post(`${BETTER_AUTH_BASE_URL}/forget-password`, async () => {
    return new HttpResponse(null, { status: 200 });
  }),

  http.post(`${BETTER_AUTH_BASE_URL}/reset-password`, async () => {
    return new HttpResponse(null, { status: 200 });
  }),

  http.get(`${API_BASE_URL}/vagas`, async ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    return HttpResponse.json({
      data: mockVagas,
      meta: {
        total: mockVagas.length,
        page,
        limit,
        totalPages: Math.ceil(mockVagas.length / limit),
      },
    });
  }),

  http.get(`${API_BASE_URL}/vagas/:id`, async ({ params }) => {
    const vaga = mockVagas.find((v) => v.id === params.id);

    if (!vaga) {
      return HttpResponse.json(
        { message: 'Vaga nao encontrada', statusCode: 404 },
        { status: 404 }
      );
    }

    return HttpResponse.json(vaga);
  }),

  http.post(`${API_BASE_URL}/vagas`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newVaga = {
      id: 'vaga-new',
      ...body,
      status: 'aberta',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json(newVaga, { status: 201 });
  }),

  http.put(`${API_BASE_URL}/vagas/:id`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    const vaga = mockVagas.find((v) => v.id === params.id);

    if (!vaga) {
      return HttpResponse.json(
        { message: 'Vaga nao encontrada', statusCode: 404 },
        { status: 404 }
      );
    }

    return HttpResponse.json({ ...vaga, ...body, updatedAt: new Date().toISOString() });
  }),

  http.delete(`${API_BASE_URL}/vagas/:id`, async ({ params }) => {
    const vaga = mockVagas.find((v) => v.id === params.id);

    if (!vaga) {
      return HttpResponse.json(
        { message: 'Vaga nao encontrada', statusCode: 404 },
        { status: 404 }
      );
    }

    return new HttpResponse(null, { status: 204 });
  }),

  http.patch(`${API_BASE_URL}/vagas/:id/status`, async ({ params, request }) => {
    const body = await request.json() as { status: string };
    const vaga = mockVagas.find((v) => v.id === params.id);

    if (!vaga) {
      return HttpResponse.json(
        { message: 'Vaga nao encontrada', statusCode: 404 },
        { status: 404 }
      );
    }

    return HttpResponse.json({ ...vaga, status: body.status, updatedAt: new Date().toISOString() });
  }),

  http.post(`${API_BASE_URL}/vagas/bulk`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>[];
    const newVagas = body.map((v, i) => ({
      id: `vaga-bulk-${i}`,
      ...v,
      status: 'aberta',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    return HttpResponse.json(newVagas, { status: 201 });
  }),

  http.get(`${API_BASE_URL}/candidaturas`, async ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    return HttpResponse.json({
      data: mockCandidaturas,
      meta: {
        total: mockCandidaturas.length,
        page,
        limit,
        totalPages: Math.ceil(mockCandidaturas.length / limit),
      },
    });
  }),

  http.get(`${API_BASE_URL}/medicos`, async ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    return HttpResponse.json({
      data: mockMedicos,
      meta: {
        total: mockMedicos.length,
        page,
        limit,
        totalPages: Math.ceil(mockMedicos.length / limit),
      },
    });
  }),

  http.get(`${API_BASE_URL}/hospitais`, async ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    return HttpResponse.json({
      data: mockHospitals,
      meta: {
        total: mockHospitals.length,
        page,
        limit,
        totalPages: Math.ceil(mockHospitals.length / limit),
      },
    });
  }),

  http.get(`${API_BASE_URL}/grades`, async ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    return HttpResponse.json({
      data: mockGrades,
      meta: {
        total: mockGrades.length,
        page,
        limit,
        totalPages: Math.ceil(mockGrades.length / limit),
      },
    });
  }),

  http.get(`${API_BASE_URL}/pagamentos`, async ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    return HttpResponse.json({
      data: mockPagamentos,
      meta: {
        total: mockPagamentos.length,
        page,
        limit,
        totalPages: Math.ceil(mockPagamentos.length / limit),
      },
    });
  }),

  http.get(`${API_BASE_URL}/relatorios/folha-pagamento`, async () => {
    return HttpResponse.json({
      data: [
        {
          medicoId: 'medico-1',
          medicoNome: 'Dr. Joao Silva',
          medicoCrm: '123456',
          totalVagas: 5,
          totalHoras: 60,
          valorTotal: 7500,
          valorPago: 4500,
          valorPendente: 3000,
          vagas: [],
        },
      ],
    });
  }),

  http.get(`${API_BASE_URL}/relatorios/grades`, async () => {
    return HttpResponse.json({
      data: [
        {
          gradeId: 'grade-1',
          gradeNome: 'Grade Janeiro 2025',
          hospitalId: 'hospital-1',
          hospitalNome: 'Hospital Central',
          setorId: 'setor-1',
          setorNome: 'UTI',
          mes: 1,
          ano: 2025,
          status: 'rascunho',
          totalSlots: 30,
          slotsPreenchidos: 25,
          slotsVazios: 5,
          percentualPreenchimento: 83.33,
          valorTotal: 45000,
        },
      ],
    });
  }),

  http.get(`${API_BASE_URL}/relatorios/produtividade`, async () => {
    return HttpResponse.json({
      data: [
        {
          medicoId: 'medico-1',
          medicoNome: 'Dr. Joao Silva',
          medicoCrm: '123456',
          totalVagas: 10,
          totalHoras: 120,
          vagasAprovadas: 8,
          vagasRejeitadas: 1,
          vagasCanceladas: 1,
          taxaAprovacao: 80,
          valorTotal: 15000,
        },
      ],
    });
  }),

  http.get(`${API_BASE_URL}/relatorios/filtros`, async () => {
    return HttpResponse.json({
      hospitais: mockHospitals.map((h) => ({ id: h.id, nome: h.nome })),
      setores: [
        { id: 'setor-1', nome: 'UTI', hospitalId: 'hospital-1' },
        { id: 'setor-2', nome: 'Emergencia', hospitalId: 'hospital-2' },
      ],
      especialidades: [
        { id: 'especialidade-1', nome: 'Clinica Geral' },
        { id: 'especialidade-2', nome: 'Cardiologia' },
      ],
      medicos: mockMedicos.map((m) => ({ id: m.id, nome: m.nome })),
      grupos: [{ id: 'grupo-1', nome: 'Grupo Principal' }],
      periodos: [
        { mes: 1, ano: 2025 },
        { mes: 12, ano: 2024 },
      ],
    });
  }),
];

export { mockUser, mockVagas, mockHospitals, mockMedicos, mockCandidaturas, mockGrades, mockPagamentos };
