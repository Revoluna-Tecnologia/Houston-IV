/* eslint-disable no-console */
import {
  PrismaClient,
  UserRole,
  EscalistaStatus,
  VagaStatus,
  CandidaturaStatus,
  GradeStatus,
  PagamentoStatus,
} from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Create Better Auth instance for seeding (same config as main app)
const auth = betterAuth({
  secret:
    process.env.BETTER_AUTH_SECRET ||
    "build-secret-placeholder-change-in-production",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8, // Match production config
    requireEmailVerification: false,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "escalista",
      },
      grupoIds: {
        type: "string[]",
        required: false,
        defaultValue: [],
      },
    },
  },
});

async function createUser(
  email: string,
  name: string,
  password: string,
  role: UserRole,
) {
  try {
    // Use Better Auth API to create user with proper password hashing
    const result = await auth.api.signUpEmail({
      body: {
        email,
        name,
        password,
      },
      asResponse: false,
    });

    if (result?.user) {
      // Update role and emailVerified using Prisma
      await prisma.user.update({
        where: { id: result.user.id },
        data: {
          role,
          emailVerified: true,
        },
      });
      console.log(`  Created user: ${email} (${role})`);
      return result.user;
    }
    return null;
  } catch (error) {
    // User might already exist
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      console.log(`  User already exists: ${email}`);
      return existingUser;
    }
    console.error(`  Failed to create user ${email}:`, error);
    return null;
  }
}

async function main() {
  console.log("Starting seed...");

  // Clean database (in order due to foreign keys)
  console.log("Cleaning database...");
  await prisma.checkinCheckout.deleteMany();
  await prisma.pagamento.deleteMany();
  await prisma.timeSlot.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.candidatura.deleteMany();
  await prisma.vaga.deleteMany();
  await prisma.escalista.deleteMany();
  await prisma.medico.deleteMany();
  await prisma.setor.deleteMany();
  await prisma.hospital.deleteMany();
  await prisma.especialidade.deleteMany();
  await prisma.grupo.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // ============================================
  // 1. USERS (via Better Auth API)
  // ============================================
  console.log("Creating users via Better Auth API...");

  const adminUser = await createUser(
    "admin@houston.com",
    "Administrador Houston",
    "12345678",
    UserRole.administrador,
  );
  const gestorUser = await createUser(
    "gestor@houston.com",
    "Gestor Houston",
    "12345678",
    UserRole.gestor,
  );
  const coordenadorUser = await createUser(
    "coordenador@houston.com",
    "Coordenador Houston",
    "12345678",
    UserRole.coordenador,
  );
  const escalistaUser = await createUser(
    "escalista@houston.com",
    "Escalista Houston",
    "12345678",
    UserRole.escalista,
  );

  const users = [adminUser, gestorUser, coordenadorUser, escalistaUser].filter(
    Boolean,
  );
  console.log(`Created ${users.length} users`);

  // ============================================
  // 2. GRUPOS
  // ============================================
  console.log("Creating groups...");

  const grupos = await Promise.all([
    prisma.grupo.create({
      data: {
        nome: "Rede São Paulo",
        descricao: "Hospitais da região de São Paulo",
      },
    }),
    prisma.grupo.create({
      data: {
        nome: "Rede Rio de Janeiro",
        descricao: "Hospitais da região do Rio de Janeiro",
      },
    }),
    prisma.grupo.create({
      data: {
        nome: "Rede Minas Gerais",
        descricao: "Hospitais da região de Minas Gerais",
      },
    }),
  ]);

  // Update admin user with grupo access
  if (adminUser) {
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { grupoIds: grupos.map((g) => g.id) },
    });
  }
  if (gestorUser) {
    await prisma.user.update({
      where: { id: gestorUser.id },
      data: { grupoIds: [grupos[0].id] },
    });
  }

  console.log(`Created ${grupos.length} groups`);

  // ============================================
  // 3. ESPECIALIDADES
  // ============================================
  console.log("Creating specialties...");

  const especialidades = await Promise.all([
    prisma.especialidade.create({
      data: { nome: "Clínica Médica", sigla: "CM", cor: "#3B82F6" },
    }),
    prisma.especialidade.create({
      data: { nome: "Pediatria", sigla: "PED", cor: "#10B981" },
    }),
    prisma.especialidade.create({
      data: { nome: "Cirurgia Geral", sigla: "CG", cor: "#EF4444" },
    }),
    prisma.especialidade.create({
      data: { nome: "Ortopedia", sigla: "ORT", cor: "#F59E0B" },
    }),
    prisma.especialidade.create({
      data: { nome: "Cardiologia", sigla: "CARD", cor: "#EC4899" },
    }),
    prisma.especialidade.create({
      data: { nome: "Neurologia", sigla: "NEURO", cor: "#8B5CF6" },
    }),
    prisma.especialidade.create({
      data: { nome: "Ginecologia e Obstetrícia", sigla: "GO", cor: "#F97316" },
    }),
    prisma.especialidade.create({
      data: { nome: "Anestesiologia", sigla: "ANEST", cor: "#06B6D4" },
    }),
  ]);

  console.log(`Created ${especialidades.length} specialties`);

  // ============================================
  // 4. HOSPITAIS
  // ============================================
  console.log("Creating hospitals...");

  const hospitais = await Promise.all([
    // São Paulo
    prisma.hospital.create({
      data: {
        nome: "Hospital São Paulo Central",
        cnpj: "12.345.678/0001-01",
        endereco: "Av. Paulista, 1000",
        cidade: "São Paulo",
        estado: "SP",
        cep: "01310-100",
        telefone: "(11) 3333-1111",
        email: "contato@hspcentral.com.br",
        grupoId: grupos[0].id,
      },
    }),
    prisma.hospital.create({
      data: {
        nome: "Hospital São Paulo Norte",
        cnpj: "12.345.678/0001-02",
        endereco: "Rua Voluntários da Pátria, 500",
        cidade: "São Paulo",
        estado: "SP",
        cep: "02011-000",
        telefone: "(11) 3333-2222",
        email: "contato@hspnorte.com.br",
        grupoId: grupos[0].id,
      },
    }),
    // Rio de Janeiro
    prisma.hospital.create({
      data: {
        nome: "Hospital Rio Centro",
        cnpj: "23.456.789/0001-01",
        endereco: "Av. Rio Branco, 200",
        cidade: "Rio de Janeiro",
        estado: "RJ",
        cep: "20040-002",
        telefone: "(21) 2222-1111",
        email: "contato@hriocentro.com.br",
        grupoId: grupos[1].id,
      },
    }),
    prisma.hospital.create({
      data: {
        nome: "Hospital Copacabana",
        cnpj: "23.456.789/0001-02",
        endereco: "Av. Atlântica, 3000",
        cidade: "Rio de Janeiro",
        estado: "RJ",
        cep: "22070-000",
        telefone: "(21) 2222-2222",
        email: "contato@hcopacabana.com.br",
        grupoId: grupos[1].id,
      },
    }),
    // Minas Gerais
    prisma.hospital.create({
      data: {
        nome: "Hospital Belo Horizonte",
        cnpj: "34.567.890/0001-01",
        endereco: "Av. Afonso Pena, 1500",
        cidade: "Belo Horizonte",
        estado: "MG",
        cep: "30130-000",
        telefone: "(31) 3333-1111",
        email: "contato@hbh.com.br",
        grupoId: grupos[2].id,
      },
    }),
  ]);

  console.log(`Created ${hospitais.length} hospitals`);

  // ============================================
  // 5. SETORES
  // ============================================
  console.log("Creating sectors...");

  const setores: Awaited<ReturnType<typeof prisma.setor.create>>[] = [];

  for (const hospital of hospitais) {
    const setoresHospital = await Promise.all([
      prisma.setor.create({
        data: {
          nome: "Pronto Socorro",
          descricao: "Atendimento de emergência 24h",
          hospitalId: hospital.id,
        },
      }),
      prisma.setor.create({
        data: {
          nome: "UTI Adulto",
          descricao: "Unidade de Terapia Intensiva Adulto",
          hospitalId: hospital.id,
        },
      }),
      prisma.setor.create({
        data: {
          nome: "Centro Cirúrgico",
          descricao: "Bloco cirúrgico",
          hospitalId: hospital.id,
        },
      }),
      prisma.setor.create({
        data: {
          nome: "Enfermaria",
          descricao: "Internação geral",
          hospitalId: hospital.id,
        },
      }),
    ]);
    setores.push(...setoresHospital);
  }

  console.log(`Created ${setores.length} sectors`);

  // ============================================
  // 6. MÉDICOS
  // ============================================
  console.log("Creating doctors...");

  const medicos = await Promise.all([
    // Clínica Médica
    prisma.medico.create({
      data: {
        nome: "Dr. João Silva",
        crm: "123456",
        crmUf: "SP",
        cpf: "111.111.111-11",
        email: "joao.silva@email.com",
        telefone: "(11) 99999-1111",
        especialidadeId: especialidades[0].id,
      },
    }),
    prisma.medico.create({
      data: {
        nome: "Dra. Maria Santos",
        crm: "123457",
        crmUf: "SP",
        cpf: "222.222.222-22",
        email: "maria.santos@email.com",
        telefone: "(11) 99999-2222",
        especialidadeId: especialidades[0].id,
      },
    }),
    // Pediatria
    prisma.medico.create({
      data: {
        nome: "Dr. Pedro Oliveira",
        crm: "234567",
        crmUf: "RJ",
        cpf: "333.333.333-33",
        email: "pedro.oliveira@email.com",
        telefone: "(21) 99999-3333",
        especialidadeId: especialidades[1].id,
      },
    }),
    prisma.medico.create({
      data: {
        nome: "Dra. Ana Costa",
        crm: "234568",
        crmUf: "RJ",
        cpf: "444.444.444-44",
        email: "ana.costa@email.com",
        telefone: "(21) 99999-4444",
        especialidadeId: especialidades[1].id,
      },
    }),
    // Cirurgia Geral
    prisma.medico.create({
      data: {
        nome: "Dr. Carlos Ferreira",
        crm: "345678",
        crmUf: "MG",
        cpf: "555.555.555-55",
        email: "carlos.ferreira@email.com",
        telefone: "(31) 99999-5555",
        especialidadeId: especialidades[2].id,
      },
    }),
    prisma.medico.create({
      data: {
        nome: "Dra. Juliana Lima",
        crm: "345679",
        crmUf: "SP",
        cpf: "666.666.666-66",
        email: "juliana.lima@email.com",
        telefone: "(11) 99999-6666",
        especialidadeId: especialidades[2].id,
      },
    }),
    // Ortopedia
    prisma.medico.create({
      data: {
        nome: "Dr. Roberto Almeida",
        crm: "456789",
        crmUf: "SP",
        cpf: "777.777.777-77",
        email: "roberto.almeida@email.com",
        telefone: "(11) 99999-7777",
        especialidadeId: especialidades[3].id,
      },
    }),
    // Cardiologia
    prisma.medico.create({
      data: {
        nome: "Dra. Fernanda Souza",
        crm: "567890",
        crmUf: "RJ",
        cpf: "888.888.888-88",
        email: "fernanda.souza@email.com",
        telefone: "(21) 99999-8888",
        especialidadeId: especialidades[4].id,
      },
    }),
    // Neurologia
    prisma.medico.create({
      data: {
        nome: "Dr. Marcos Pereira",
        crm: "678901",
        crmUf: "MG",
        cpf: "999.999.999-99",
        email: "marcos.pereira@email.com",
        telefone: "(31) 99999-9999",
        especialidadeId: especialidades[5].id,
      },
    }),
    // Ginecologia
    prisma.medico.create({
      data: {
        nome: "Dra. Patrícia Mendes",
        crm: "789012",
        crmUf: "SP",
        cpf: "101.010.101-01",
        email: "patricia.mendes@email.com",
        telefone: "(11) 99999-0101",
        especialidadeId: especialidades[6].id,
      },
    }),
    // Anestesiologia
    prisma.medico.create({
      data: {
        nome: "Dr. Ricardo Nunes",
        crm: "890123",
        crmUf: "RJ",
        cpf: "121.212.121-21",
        email: "ricardo.nunes@email.com",
        telefone: "(21) 99999-1212",
        especialidadeId: especialidades[7].id,
      },
    }),
    prisma.medico.create({
      data: {
        nome: "Dra. Camila Rodrigues",
        crm: "890124",
        crmUf: "MG",
        cpf: "131.313.131-31",
        email: "camila.rodrigues@email.com",
        telefone: "(31) 99999-1313",
        especialidadeId: especialidades[7].id,
      },
    }),
  ]);

  console.log(`Created ${medicos.length} doctors`);

  // ============================================
  // 7. ESCALISTAS (médicos vinculados a grupos)
  // ============================================
  console.log("Creating escalistas...");

  const escalistas = await Promise.all([
    // Médicos de SP no grupo SP
    prisma.escalista.create({
      data: {
        medicoId: medicos[0].id,
        grupoId: grupos[0].id,
        status: EscalistaStatus.ativo,
      },
    }),
    prisma.escalista.create({
      data: {
        medicoId: medicos[1].id,
        grupoId: grupos[0].id,
        status: EscalistaStatus.ativo,
      },
    }),
    prisma.escalista.create({
      data: {
        medicoId: medicos[5].id,
        grupoId: grupos[0].id,
        status: EscalistaStatus.ativo,
      },
    }),
    prisma.escalista.create({
      data: {
        medicoId: medicos[6].id,
        grupoId: grupos[0].id,
        status: EscalistaStatus.ativo,
      },
    }),
    // Médicos do RJ no grupo RJ
    prisma.escalista.create({
      data: {
        medicoId: medicos[2].id,
        grupoId: grupos[1].id,
        status: EscalistaStatus.ativo,
      },
    }),
    prisma.escalista.create({
      data: {
        medicoId: medicos[3].id,
        grupoId: grupos[1].id,
        status: EscalistaStatus.ativo,
      },
    }),
    prisma.escalista.create({
      data: {
        medicoId: medicos[7].id,
        grupoId: grupos[1].id,
        status: EscalistaStatus.ativo,
      },
    }),
    // Médicos de MG no grupo MG
    prisma.escalista.create({
      data: {
        medicoId: medicos[4].id,
        grupoId: grupos[2].id,
        status: EscalistaStatus.ativo,
      },
    }),
    prisma.escalista.create({
      data: {
        medicoId: medicos[8].id,
        grupoId: grupos[2].id,
        status: EscalistaStatus.ativo,
      },
    }),
  ]);

  console.log(`Created ${escalistas.length} escalistas`);

  // ============================================
  // 8. VAGAS (últimos 3 meses + próximo mês)
  // ============================================
  console.log("Creating vacancies...");

  const today = new Date();
  const vagas: Awaited<ReturnType<typeof prisma.vaga.create>>[] = [];

  // Gerar vagas para os últimos 3 meses e próximo mês
  for (let monthOffset = -3; monthOffset <= 1; monthOffset++) {
    const month = new Date(
      today.getFullYear(),
      today.getMonth() + monthOffset,
      1,
    );
    const daysInMonth = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0,
    ).getDate();

    // Gerar ~10 vagas por hospital por mês
    for (const hospital of hospitais) {
      const hospitalSetores = setores.filter(
        (s) => s.hospitalId === hospital.id,
      );

      for (let i = 0; i < 10; i++) {
        const day = Math.floor(Math.random() * daysInMonth) + 1;
        const vagaDate = new Date(month.getFullYear(), month.getMonth(), day);

        // Skip weekends sometimes
        if (vagaDate.getDay() === 0 && Math.random() > 0.3) continue;

        const setor =
          hospitalSetores[Math.floor(Math.random() * hospitalSetores.length)];
        const especialidade =
          especialidades[Math.floor(Math.random() * especialidades.length)];

        // Determine shift
        const shifts = [
          { inicio: "07:00", fim: "13:00", valor: 800 },
          { inicio: "13:00", fim: "19:00", valor: 800 },
          { inicio: "19:00", fim: "07:00", valor: 1500 },
          { inicio: "07:00", fim: "19:00", valor: 1500 },
          { inicio: "19:00", fim: "07:00", valor: 1800 },
        ];
        const shift = shifts[Math.floor(Math.random() * shifts.length)];

        // Determine status based on date
        let status: VagaStatus;
        if (vagaDate < today) {
          status =
            Math.random() > 0.2 ? VagaStatus.fechada : VagaStatus.cancelada;
        } else if (
          vagaDate.getTime() - today.getTime() <
          7 * 24 * 60 * 60 * 1000
        ) {
          status =
            Math.random() > 0.3 ? VagaStatus.anunciada : VagaStatus.aberta;
        } else {
          status = VagaStatus.aberta;
        }

        const vaga = await prisma.vaga.create({
          data: {
            data: vagaDate,
            horaInicio: shift.inicio,
            horaFim: shift.fim,
            valor: shift.valor + Math.floor(Math.random() * 500),
            observacoes:
              Math.random() > 0.7
                ? "Urgente - necessário experiência em UTI"
                : undefined,
            status,
            hospitalId: hospital.id,
            setorId: setor.id,
            especialidadeId: especialidade.id,
          },
        });
        vagas.push(vaga);
      }
    }
  }

  console.log(`Created ${vagas.length} vacancies`);

  // ============================================
  // 9. CANDIDATURAS
  // ============================================
  console.log("Creating applications...");

  const candidaturas: Awaited<ReturnType<typeof prisma.candidatura.create>>[] =
    [];

  // Candidaturas para vagas abertas e anunciadas
  const vagasDisponiveis = vagas.filter(
    (v) => v.status === VagaStatus.aberta || v.status === VagaStatus.anunciada,
  );

  for (const vaga of vagasDisponiveis.slice(0, 50)) {
    // 1-3 candidatos por vaga
    const numCandidatos = Math.floor(Math.random() * 3) + 1;
    const candidatosMedicos = [...medicos]
      .sort(() => Math.random() - 0.5)
      .slice(0, numCandidatos);

    for (const medico of candidatosMedicos) {
      const candidatura = await prisma.candidatura.create({
        data: {
          vagaId: vaga.id,
          medicoId: medico.id,
          status: CandidaturaStatus.pendente,
        },
      });
      candidaturas.push(candidatura);
    }
  }

  // Candidaturas aprovadas para vagas fechadas
  const vagasFechadas = vagas.filter((v) => v.status === VagaStatus.fechada);

  for (const vaga of vagasFechadas.slice(0, 100)) {
    const medico = medicos[Math.floor(Math.random() * medicos.length)];

    try {
      const candidatura = await prisma.candidatura.create({
        data: {
          vagaId: vaga.id,
          medicoId: medico.id,
          status: CandidaturaStatus.aprovada,
        },
      });
      candidaturas.push(candidatura);
    } catch {
      // Ignore duplicate key errors
    }
  }

  console.log(`Created ${candidaturas.length} applications`);

  // ============================================
  // 10. GRADES (escalas mensais)
  // ============================================
  console.log("Creating schedules...");

  const grades: Awaited<ReturnType<typeof prisma.grade.create>>[] = [];

  // Uma grade por setor para o mês atual e próximo
  for (let monthOffset = 0; monthOffset <= 1; monthOffset++) {
    const startDate = new Date(
      today.getFullYear(),
      today.getMonth() + monthOffset,
      1,
    );
    const endDate = new Date(
      today.getFullYear(),
      today.getMonth() + monthOffset + 1,
      0,
    );

    for (const hospital of hospitais.slice(0, 3)) {
      const hospitalSetores = setores.filter(
        (s) => s.hospitalId === hospital.id,
      );

      for (const setor of hospitalSetores.slice(0, 2)) {
        const monthName = startDate.toLocaleDateString("pt-BR", {
          month: "long",
          year: "numeric",
        });

        const grade = await prisma.grade.create({
          data: {
            nome: `Escala ${setor.nome} - ${monthName}`,
            descricao: `Escala mensal do setor ${setor.nome}`,
            dataInicio: startDate,
            dataFim: endDate,
            hospitalId: hospital.id,
            setorId: setor.id,
            status:
              monthOffset === 0 ? GradeStatus.publicada : GradeStatus.rascunho,
          },
        });
        grades.push(grade);

        // Criar time slots para a grade
        const daysInMonth = endDate.getDate();
        for (let day = 1; day <= daysInMonth; day++) {
          const slotDate = new Date(
            startDate.getFullYear(),
            startDate.getMonth(),
            day,
          );

          // Pular alguns dias aleatoriamente
          if (Math.random() > 0.7) continue;

          const medico = medicos[Math.floor(Math.random() * medicos.length)];

          await prisma.timeSlot.create({
            data: {
              gradeId: grade.id,
              medicoId: medico.id,
              data: slotDate,
              horaInicio: "07:00",
              horaFim: "19:00",
            },
          });
        }
      }
    }
  }

  console.log(`Created ${grades.length} schedules`);

  // ============================================
  // 11. PAGAMENTOS
  // ============================================
  console.log("Creating payments...");

  const pagamentos: Awaited<ReturnType<typeof prisma.pagamento.create>>[] = [];

  // Pagamentos para candidaturas aprovadas
  const candidaturasAprovadas = candidaturas.filter(
    (c) => c.status === CandidaturaStatus.aprovada,
  );

  for (const candidatura of candidaturasAprovadas.slice(0, 80)) {
    const vaga = vagas.find((v) => v.id === candidatura.vagaId);
    if (!vaga) continue;

    // Determinar status do pagamento baseado na data
    let status: PagamentoStatus;
    const vagaDate = new Date(vaga.data);
    const daysDiff = Math.floor(
      (today.getTime() - vagaDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysDiff > 30) {
      status = PagamentoStatus.pago;
    } else if (daysDiff > 14) {
      status =
        Math.random() > 0.3 ? PagamentoStatus.pago : PagamentoStatus.autorizado;
    } else if (daysDiff > 7) {
      status =
        Math.random() > 0.5
          ? PagamentoStatus.autorizado
          : PagamentoStatus.pendente;
    } else {
      status = PagamentoStatus.pendente;
    }

    const pagamento = await prisma.pagamento.create({
      data: {
        vagaId: vaga.id,
        medicoId: candidatura.medicoId,
        valor: vaga.valor,
        status,
        dataAutorizacao:
          status !== PagamentoStatus.pendente
            ? new Date(vagaDate.getTime() + 7 * 24 * 60 * 60 * 1000)
            : undefined,
        dataPagamento:
          status === PagamentoStatus.pago
            ? new Date(vagaDate.getTime() + 21 * 24 * 60 * 60 * 1000)
            : undefined,
      },
    });
    pagamentos.push(pagamento);
  }

  console.log(`Created ${pagamentos.length} payments`);

  // ============================================
  // 12. CHECK-IN/CHECK-OUT
  // ============================================
  console.log("Creating check-ins/check-outs...");

  const checkins: Awaited<ReturnType<typeof prisma.checkinCheckout.create>>[] =
    [];

  // Check-ins para vagas fechadas do passado
  const vagasPassadas = vagasFechadas.filter((v) => new Date(v.data) < today);

  for (const vaga of vagasPassadas.slice(0, 60)) {
    const candidatura = candidaturasAprovadas.find((c) => c.vagaId === vaga.id);
    if (!candidatura) continue;

    const vagaDate = new Date(vaga.data);
    const [horaI, minI] = vaga.horaInicio.split(":").map(Number);
    const [horaF, minF] = vaga.horaFim.split(":").map(Number);

    const checkinTime = new Date(vagaDate);
    checkinTime.setHours(horaI, minI + Math.floor(Math.random() * 15));

    const checkoutTime = new Date(vagaDate);
    if (horaF < horaI) {
      checkoutTime.setDate(checkoutTime.getDate() + 1);
    }
    checkoutTime.setHours(horaF, minF + Math.floor(Math.random() * 15));

    try {
      const checkin = await prisma.checkinCheckout.create({
        data: {
          vagaId: vaga.id,
          medicoId: candidatura.medicoId,
          checkinAt: checkinTime,
          checkoutAt: checkoutTime,
        },
      });
      checkins.push(checkin);
    } catch {
      // Ignore duplicates
    }
  }

  console.log(`Created ${checkins.length} check-ins/check-outs`);

  // ============================================
  // SUMMARY
  // ============================================
  console.log("\n========================================");
  console.log("SEED COMPLETED SUCCESSFULLY!");
  console.log("========================================");
  console.log(`Users: ${users.length}`);
  console.log(`Groups: ${grupos.length}`);
  console.log(`Specialties: ${especialidades.length}`);
  console.log(`Hospitals: ${hospitais.length}`);
  console.log(`Sectors: ${setores.length}`);
  console.log(`Doctors: ${medicos.length}`);
  console.log(`Escalistas: ${escalistas.length}`);
  console.log(`Vacancies: ${vagas.length}`);
  console.log(`Applications: ${candidaturas.length}`);
  console.log(`Schedules: ${grades.length}`);
  console.log(`Payments: ${pagamentos.length}`);
  console.log(`Check-ins: ${checkins.length}`);
  console.log("========================================");
  console.log("\nTest credentials (password: 12345678):");
  console.log("- admin@houston.com (Administrador)");
  console.log("- gestor@houston.com (Gestor)");
  console.log("- coordenador@houston.com (Coordenador)");
  console.log("- escalista@houston.com (Escalista)");
  console.log("========================================\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
