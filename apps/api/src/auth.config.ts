import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const secret = process.env.BETTER_AUTH_SECRET
if (!secret) {
  throw new Error('BETTER_AUTH_SECRET environment variable is required')
}

export const auth = betterAuth({
  secret,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3001',
  basePath: '/auth', // With global prefix 'api', routes will be at /api/auth/*
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: false,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID || '',
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
      tenantId: 'common',
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'escalista',
      },
      grupoIds: {
        type: 'string[]',
        required: false,
        defaultValue: [],
      },
    },
  },

  trustedOrigins: process.env.TRUSTED_ORIGINS
    ? process.env.TRUSTED_ORIGINS.split(',').map(origin => origin.trim())
    : [
        'http://localhost:3000',
        'http://localhost:3001',
      ],
})

const trustedOrigins = process.env.TRUSTED_ORIGINS
  ? process.env.TRUSTED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:3001']

// Log apenas em dev para não expor config em produção
if (process.env.NODE_ENV !== 'production') {
  const { Logger } = require('@nestjs/common')
  new Logger('BetterAuth').log(`Configured with trustedOrigins: ${trustedOrigins.join(', ')}`)
}

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
