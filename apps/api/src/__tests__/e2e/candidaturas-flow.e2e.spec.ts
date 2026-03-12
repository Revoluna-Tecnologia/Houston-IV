import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../../app.module";
import { PrismaService } from "../../prisma/prisma.service";
import { AppRole } from "../../auth/types/auth.types";

describe("Candidaturas Flow E2E", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testGrupoId: string;
  let testHospitalId: string;
  let testSetorId: string;
  let testEspecialidadeId: string;
  let testMedicoId: string;
  let testVagaId: string;

  const createTestUser = async (role: AppRole = AppRole.ADMINISTRADOR) => {
    const userId = crypto.randomUUID();
    const email = `candidaturas-${role}-${Date.now()}@test.com`;

    await prisma.$executeRawUnsafe(`
      INSERT INTO users (id, email, name, email_verified, role, created_at, updated_at)
      VALUES ('${userId}', '${email}', 'Test User', true, '${role}', NOW(), NOW())
    `);

    await prisma.$executeRawUnsafe(`
      INSERT INTO houston.user_roles (user_id, role, grupo_ids, hospital_ids, setor_ids)
      VALUES ('${userId}'::uuid, '${role}'::houston.app_role, ARRAY['${testGrupoId}']::uuid[], ARRAY['${testHospitalId}']::uuid[], ARRAY['${testSetorId}']::uuid[])
    `);

    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.$executeRawUnsafe(`
      INSERT INTO sessions (id, user_id, token, expires_at, created_at, updated_at)
      VALUES ('${crypto.randomUUID()}', '${userId}', '${sessionToken}', '${expiresAt.toISOString()}', NOW(), NOW())
    `);

    return {
      userId,
      email,
      sessionToken,
      cookie: `better-auth.session_token=${sessionToken}`,
    };
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    prisma = moduleRef.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up
    await prisma.candidatura.deleteMany();
    await prisma.vaga.deleteMany();
    await prisma.medico.deleteMany();
    await prisma.$executeRawUnsafe("DELETE FROM sessions");
    await prisma.$executeRawUnsafe("DELETE FROM houston.user_roles");
    await prisma.$executeRawUnsafe("DELETE FROM users");
    await prisma.setor.deleteMany();
    await prisma.hospital.deleteMany();
    await prisma.especialidade.deleteMany();
    await prisma.grupo.deleteMany();

    // Create test data
    const grupo = await prisma.grupo.create({
      data: { nome: "Grupo Candidaturas E2E" },
    });
    testGrupoId = grupo.id;

    const especialidade = await prisma.especialidade.create({
      data: { nome: "Anestesiologia" },
    });
    testEspecialidadeId = especialidade.id;

    const hospital = await prisma.hospital.create({
      data: {
        nome: "Hospital Candidaturas E2E",
        cidade: "Rio de Janeiro",
        estado: "RJ",
        grupoId: testGrupoId,
      },
    });
    testHospitalId = hospital.id;

    const setor = await prisma.setor.create({
      data: {
        nome: "Centro Cirurgico",
        hospitalId: testHospitalId,
      },
    });
    testSetorId = setor.id;

    // Create test medico
    const medico = await prisma.medico.create({
      data: {
        nome: "Dr. Teste E2E",
        crm: `CRM-${Date.now()}`,
        crmUf: "SP",
        telefone: "11999999999",
        especialidadeId: testEspecialidadeId,
      },
    });
    testMedicoId = medico.id;

    // Create test vaga
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const vaga = await prisma.vaga.create({
      data: {
        data: tomorrow,
        horaInicio: "08:00",
        horaFim: "18:00",
        valor: 150,
        status: "anunciada",
        hospitalId: testHospitalId,
        setorId: testSetorId,
        especialidadeId: testEspecialidadeId,
      },
    });
    testVagaId = vaga.id;
  });

  describe("Candidatura CRUD Flow", () => {
    it("should create a candidatura", async () => {
      const { cookie } = await createTestUser();

      const createResponse = await request(app.getHttpServer())
        .post("/candidaturas")
        .set("Cookie", cookie)
        .send({
          medicoId: testMedicoId,
          vagaId: testVagaId,
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.data.id).toBeDefined();
      expect(createResponse.body.data.status).toBe("pendente");
      expect(createResponse.body.data.medicoId).toBe(testMedicoId);
      expect(createResponse.body.data.vagaId).toBe(testVagaId);
    });

    it("should list candidaturas for a vaga", async () => {
      const { cookie } = await createTestUser();

      // Create candidatura
      await request(app.getHttpServer())
        .post("/candidaturas")
        .set("Cookie", cookie)
        .send({
          medicoId: testMedicoId,
          vagaId: testVagaId,
        });

      // List candidaturas
      const listResponse = await request(app.getHttpServer())
        .get(`/candidaturas?vagaId=${testVagaId}`)
        .set("Cookie", cookie);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.data).toHaveLength(1);
    });

    it("should get candidatura by id", async () => {
      const { cookie } = await createTestUser();

      // Create candidatura
      const createResponse = await request(app.getHttpServer())
        .post("/candidaturas")
        .set("Cookie", cookie)
        .send({
          medicoId: testMedicoId,
          vagaId: testVagaId,
        });

      const candidaturaId = createResponse.body.data.id;

      // Get candidatura
      const getResponse = await request(app.getHttpServer())
        .get(`/candidaturas/${candidaturaId}`)
        .set("Cookie", cookie);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.data.id).toBe(candidaturaId);
    });
  });

  describe("Candidatura Status Flow", () => {
    it("should approve a candidatura", async () => {
      const { cookie } = await createTestUser();

      // Create candidatura
      const createResponse = await request(app.getHttpServer())
        .post("/candidaturas")
        .set("Cookie", cookie)
        .send({
          medicoId: testMedicoId,
          vagaId: testVagaId,
        });

      const candidaturaId = createResponse.body.data.id;

      // Approve
      const approveResponse = await request(app.getHttpServer())
        .post(`/candidaturas/${candidaturaId}/aprovar`)
        .set("Cookie", cookie);

      expect(approveResponse.status).toBe(200);
      expect(approveResponse.body.data.status).toBe("aprovada");
    });

    it("should reject a candidatura", async () => {
      const { cookie } = await createTestUser();

      // Create candidatura
      const createResponse = await request(app.getHttpServer())
        .post("/candidaturas")
        .set("Cookie", cookie)
        .send({
          medicoId: testMedicoId,
          vagaId: testVagaId,
        });

      const candidaturaId = createResponse.body.data.id;

      // Reject
      const rejectResponse = await request(app.getHttpServer())
        .post(`/candidaturas/${candidaturaId}/rejeitar`)
        .set("Cookie", cookie)
        .send({ motivo: "Medico indisponivel" });

      expect(rejectResponse.status).toBe(200);
      expect(rejectResponse.body.data.status).toBe("rejeitada");
    });

    it("should close vaga when candidatura is approved", async () => {
      const { cookie } = await createTestUser();

      // Create candidatura
      const createResponse = await request(app.getHttpServer())
        .post("/candidaturas")
        .set("Cookie", cookie)
        .send({
          medicoId: testMedicoId,
          vagaId: testVagaId,
        });

      const candidaturaId = createResponse.body.data.id;

      // Approve
      await request(app.getHttpServer())
        .post(`/candidaturas/${candidaturaId}/aprovar`)
        .set("Cookie", cookie);

      // Check vaga status
      const vagaResponse = await request(app.getHttpServer())
        .get(`/vagas/${testVagaId}`)
        .set("Cookie", cookie);

      expect(vagaResponse.status).toBe(200);
      expect(vagaResponse.body.data.status).toBe("fechada");
    });
  });

  describe("Candidatura Validation", () => {
    it("should not allow duplicate candidatura", async () => {
      const { cookie } = await createTestUser();

      // Create first candidatura
      await request(app.getHttpServer())
        .post("/candidaturas")
        .set("Cookie", cookie)
        .send({
          medicoId: testMedicoId,
          vagaId: testVagaId,
        });

      // Try to create duplicate
      const duplicateResponse = await request(app.getHttpServer())
        .post("/candidaturas")
        .set("Cookie", cookie)
        .send({
          medicoId: testMedicoId,
          vagaId: testVagaId,
        });

      expect(duplicateResponse.status).toBe(409);
    });

    it("should not allow candidatura for closed vaga", async () => {
      const { cookie } = await createTestUser();

      // Close the vaga
      await prisma.vaga.update({
        where: { id: testVagaId },
        data: { status: "fechada" },
      });

      // Try to create candidatura
      const createResponse = await request(app.getHttpServer())
        .post("/candidaturas")
        .set("Cookie", cookie)
        .send({
          medicoId: testMedicoId,
          vagaId: testVagaId,
        });

      expect(createResponse.status).toBe(400);
    });
  });

  describe("Role-based Candidatura Access", () => {
    it("should allow gestor to view candidaturas in their grupo", async () => {
      const { cookie: adminCookie } = await createTestUser(
        AppRole.ADMINISTRADOR,
      );
      const { cookie: gestorCookie } = await createTestUser(AppRole.GESTOR);

      // Admin creates candidatura
      const createResponse = await request(app.getHttpServer())
        .post("/candidaturas")
        .set("Cookie", adminCookie)
        .send({
          medicoId: testMedicoId,
          vagaId: testVagaId,
        });

      const candidaturaId = createResponse.body.data.id;

      // Gestor should be able to view
      const viewResponse = await request(app.getHttpServer())
        .get(`/candidaturas/${candidaturaId}`)
        .set("Cookie", gestorCookie);

      expect(viewResponse.status).toBe(200);
    });

    it("should allow coordenador to approve candidaturas", async () => {
      const { cookie: adminCookie } = await createTestUser(
        AppRole.ADMINISTRADOR,
      );
      const { cookie: coordenadorCookie } = await createTestUser(
        AppRole.COORDENADOR,
      );

      // Admin creates candidatura
      const createResponse = await request(app.getHttpServer())
        .post("/candidaturas")
        .set("Cookie", adminCookie)
        .send({
          medicoId: testMedicoId,
          vagaId: testVagaId,
        });

      const candidaturaId = createResponse.body.data.id;

      // Coordenador should be able to approve
      const approveResponse = await request(app.getHttpServer())
        .post(`/candidaturas/${candidaturaId}/aprovar`)
        .set("Cookie", coordenadorCookie);

      expect(approveResponse.status).toBe(200);
    });
  });
});
