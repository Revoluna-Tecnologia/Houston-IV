import { beforeAll, afterAll, beforeEach } from 'vitest'
import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'

const DATABASE_URL = 'postgresql://test:test@localhost:5433/houston_test?schema=public'

let prisma: PrismaClient

beforeAll(async () => {
  // Set environment variable for Prisma
  process.env.DATABASE_URL = DATABASE_URL
  process.env.NODE_ENV = 'test'

  // Ensure Docker container is running
  try {
    execSync('docker compose -f docker-compose.test.yml up -d --wait', {
      stdio: 'pipe',
      cwd: process.cwd(),
    })
  } catch {
    // Docker container may already be running or Docker not available
  }

  // Wait for database to be ready
  await new Promise((resolve) => setTimeout(resolve, 3000))

  // Initialize Prisma client
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: DATABASE_URL,
      },
    },
  })

  // Apply migrations
  try {
    execSync('npx prisma migrate deploy', {
      stdio: 'pipe',
      env: { ...process.env, DATABASE_URL },
    })
  } catch {
    // Migration may have already been applied or schema needs adjustment
  }

  // Connect to database
  await prisma.$connect()
})

afterAll(async () => {
  if (prisma) {
    await prisma.$disconnect()
  }
})

beforeEach(async () => {
  // Clean data between tests while preserving schema
  if (prisma) {
    try {
      await prisma.$transaction([
        prisma.$executeRawUnsafe('TRUNCATE TABLE houston.candidatura CASCADE'),
        prisma.$executeRawUnsafe('TRUNCATE TABLE houston.checkin_checkout CASCADE'),
        prisma.$executeRawUnsafe('TRUNCATE TABLE houston.pagamento CASCADE'),
        prisma.$executeRawUnsafe('TRUNCATE TABLE houston.vaga CASCADE'),
        prisma.$executeRawUnsafe('TRUNCATE TABLE houston.grade_time_slot CASCADE'),
        prisma.$executeRawUnsafe('TRUNCATE TABLE houston.grade CASCADE'),
        prisma.$executeRawUnsafe('TRUNCATE TABLE houston.escalista CASCADE'),
        prisma.$executeRawUnsafe('TRUNCATE TABLE houston.medico CASCADE'),
        prisma.$executeRawUnsafe('TRUNCATE TABLE houston.setor CASCADE'),
        prisma.$executeRawUnsafe('TRUNCATE TABLE houston.hospital CASCADE'),
        prisma.$executeRawUnsafe('TRUNCATE TABLE houston.especialidade CASCADE'),
        prisma.$executeRawUnsafe('TRUNCATE TABLE houston.grupo CASCADE'),
      ])
    } catch {
      // Tables may not exist yet in test database
    }
  }
})

export { prisma }
