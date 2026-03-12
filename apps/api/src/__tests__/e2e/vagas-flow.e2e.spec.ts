import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../../app.module";
import { PrismaService } from "../../prisma/prisma.service";
import { AppRole } from "../../auth/types/auth.types";

describe("Vagas Flow E2E", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testGrupoId: string;
  let testHospitalId: string;
  let testSetorId: string;
  let testEspecialidadeId: string;

  const createTestUser = async (role: AppRole = AppRole.ADMINISTRADOR) => {
    const userId = crypto.randomUUID();
    const email = `vagas-${role}-${Date.now()}@test.com`;

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
    await prisma.$executeRawUnsafe("DELETE FROM sessions");
    await prisma.$executeRawUnsafe("DELETE FROM houston.user_roles");
    await prisma.$executeRawUnsafe("DELETE FROM users");
    await prisma.vaga.deleteMany();
    await prisma.setor.deleteMany();
    await prisma.hospital.deleteMany();
    await prisma.especialidade.deleteMany();
    await prisma.grupo.deleteMany();

    // Create test data
    const grupo = await prisma.grupo.create({
      data: { nome: "Grupo Vagas E2E" },
    });
    testGrupoId = grupo.id;

    const especialidade = await prisma.especialidade.create({
      data: { nome: "Cardiologia" },
    });
    testEspecialidadeId = especialidade.id;

    const hospital = await prisma.hospital.create({
      data: {
        nome: "Hospital E2E",
        cidade: "Sao Paulo",
        estado: "SP",
        grupoId: testGrupoId,
      },
    });
    testHospitalId = hospital.id;

    const setor = await prisma.setor.create({
      data: {
        nome: "UTI",
        hospitalId: testHospitalId,
      },
    });
    testSetorId = setor.id;
  });

  describe("Vaga CRUD Flow", () => {
    it("should create, read, update, and delete a vaga", async () => {
      const { cookie } = await createTestUser();

      // CREATE
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const createResponse = await request(app.getHttpServer())
        .post("/vagas")
        .set("Cookie", cookie)
        .send({
          data: tomorrow.toISOString(),
          horaInicio: "08:00",
          horaFim: "18:00",
          valor: 150,
          setorId: testSetorId,
          especialidadeId: testEspecialidadeId,
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.data.id).toBeDefined();
      const vagaId = createResponse.body.data.id;

      // READ
      const readResponse = await request(app.getHttpServer())
        .get(`/vagas/${vagaId}`)
        .set("Cookie", cookie);

      expect(readResponse.status).toBe(200);
      expect(readResponse.body.data.valor).toBe(150);

      // UPDATE
      const updateResponse = await request(app.getHttpServer())
        .patch(`/vagas/${vagaId}`)
        .set("Cookie", cookie)
        .send({ valor: 180 });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.valor).toBe(180);

      // DELETE
      const deleteResponse = await request(app.getHttpServer())
        .delete(`/vagas/${vagaId}`)
        .set("Cookie", cookie);

      expect(deleteResponse.status).toBe(204);

      // Verify deleted
      const verifyResponse = await request(app.getHttpServer())
        .get(`/vagas/${vagaId}`)
        .set("Cookie", cookie);

      expect(verifyResponse.status).toBe(404);
    });

    it("should list vagas with pagination", async () => {
      const { cookie } = await createTestUser();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Create 5 vagas
      for (let i = 0; i < 5; i++) {
        const date = new Date(tomorrow);
        date.setDate(date.getDate() + i);

        await request(app.getHttpServer())
          .post("/vagas")
          .set("Cookie", cookie)
          .send({
            data: date.toISOString(),
            horaInicio: "08:00",
            horaFim: "18:00",
            valor: 150 + i * 10,
            setorId: testSetorId,
            especialidadeId: testEspecialidadeId,
          });
      }

      // List with pagination
      const listResponse = await request(app.getHttpServer())
        .get("/vagas?page=1&limit=3")
        .set("Cookie", cookie);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.data).toHaveLength(3);
      expect(listResponse.body.pagination.total).toBe(5);
      expect(listResponse.body.pagination.totalPages).toBe(2);
    });

    it("should filter vagas by setor", async () => {
      const { cookie } = await createTestUser();

      // Create another setor
      const setor2 = await prisma.setor.create({
        data: {
          nome: "Emergencia",
          hospitalId: testHospitalId,
        },
      });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Create vaga in UTI
      await request(app.getHttpServer())
        .post("/vagas")
        .set("Cookie", cookie)
        .send({
          data: tomorrow.toISOString(),
          horaInicio: "08:00",
          horaFim: "18:00",
          valor: 150,
          setorId: testSetorId,
          especialidadeId: testEspecialidadeId,
        });

      // Create vaga in Emergencia
      await request(app.getHttpServer())
        .post("/vagas")
        .set("Cookie", cookie)
        .send({
          data: tomorrow.toISOString(),
          horaInicio: "18:00",
          horaFim: "08:00",
          valor: 200,
          setorId: setor2.id,
          especialidadeId: testEspecialidadeId,
        });

      // Filter by UTI
      const filterResponse = await request(app.getHttpServer())
        .get(`/vagas?setorId=${testSetorId}`)
        .set("Cookie", cookie);

      expect(filterResponse.status).toBe(200);
      expect(filterResponse.body.data).toHaveLength(1);
      expect(filterResponse.body.data[0].setorId).toBe(testSetorId);
    });
  });

  describe("Vaga Status Flow", () => {
    it("should change vaga status through lifecycle", async () => {
      const { cookie } = await createTestUser();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Create vaga
      const createResponse = await request(app.getHttpServer())
        .post("/vagas")
        .set("Cookie", cookie)
        .send({
          data: tomorrow.toISOString(),
          horaInicio: "08:00",
          horaFim: "18:00",
          valor: 150,
          setorId: testSetorId,
          especialidadeId: testEspecialidadeId,
        });

      const vagaId = createResponse.body.data.id;
      expect(createResponse.body.data.status).toBe("aberta");

      // Announce vaga
      const announceResponse = await request(app.getHttpServer())
        .post(`/vagas/${vagaId}/anunciar`)
        .set("Cookie", cookie);

      expect(announceResponse.status).toBe(200);
      expect(announceResponse.body.data.status).toBe("anunciada");

      // Cancel vaga
      const cancelResponse = await request(app.getHttpServer())
        .post(`/vagas/${vagaId}/cancelar`)
        .set("Cookie", cookie);

      expect(cancelResponse.status).toBe(200);
      expect(cancelResponse.body.data.status).toBe("cancelada");
    });
  });

  describe("Role-based Vaga Access", () => {
    it("should allow gestor to view vagas in their grupo", async () => {
      const { cookie: adminCookie } = await createTestUser(
        AppRole.ADMINISTRADOR,
      );
      const { cookie: gestorCookie } = await createTestUser(AppRole.GESTOR);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Admin creates vaga
      const createResponse = await request(app.getHttpServer())
        .post("/vagas")
        .set("Cookie", adminCookie)
        .send({
          data: tomorrow.toISOString(),
          horaInicio: "08:00",
          horaFim: "18:00",
          valor: 150,
          setorId: testSetorId,
          especialidadeId: testEspecialidadeId,
        });

      const vagaId = createResponse.body.data.id;

      // Gestor should be able to view
      const viewResponse = await request(app.getHttpServer())
        .get(`/vagas/${vagaId}`)
        .set("Cookie", gestorCookie);

      expect(viewResponse.status).toBe(200);
    });

    it("should not allow escalista to create vagas", async () => {
      const { cookie } = await createTestUser(AppRole.ESCALISTA);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const createResponse = await request(app.getHttpServer())
        .post("/vagas")
        .set("Cookie", cookie)
        .send({
          data: tomorrow.toISOString(),
          horaInicio: "08:00",
          horaFim: "18:00",
          valor: 150,
          setorId: testSetorId,
          especialidadeId: testEspecialidadeId,
        });

      expect(createResponse.status).toBe(403);
    });
  });
});
