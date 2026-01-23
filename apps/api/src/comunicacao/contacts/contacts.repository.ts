/**
 * Contacts Repository
 * Responsável pelo acesso a dados dos contatos
 */

import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { ChatContact, Prisma } from '@prisma/client'
import { ContactQueryDto } from './dto'

export interface CreateContactData {
  ownerId: string
  name: string
  phoneNumber: string
  email?: string
  avatarUrl?: string
  linkedUserId?: string
  linkedMedicoId?: string
  isFavorite?: boolean
  notes?: string
}

export interface UpdateContactData {
  name?: string
  email?: string
  avatarUrl?: string
  linkedMedicoId?: string
  isFavorite?: boolean
  isBlocked?: boolean
  notes?: string
}

export interface ContactWithMedico extends ChatContact {
  linkedMedico?: {
    id: string
    nome: string
    email: string | null
    telefone: string | null
  } | null
}

@Injectable()
export class ContactsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateContactData): Promise<ChatContact> {
    return this.prisma.chatContact.create({
      data: {
        ownerId: data.ownerId,
        name: data.name,
        phoneNumber: this.normalizePhone(data.phoneNumber),
        email: data.email,
        avatarUrl: data.avatarUrl,
        linkedUserId: data.linkedUserId,
        linkedMedicoId: data.linkedMedicoId,
        isFavorite: data.isFavorite || false,
        notes: data.notes,
      },
    })
  }

  async findById(id: string): Promise<ContactWithMedico | null> {
    return this.prisma.chatContact.findUnique({
      where: { id },
      include: {
        linkedMedico: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
          },
        },
      },
    })
  }

  async findByOwnerAndPhone(ownerId: string, phoneNumber: string): Promise<ChatContact | null> {
    return this.prisma.chatContact.findUnique({
      where: {
        ownerId_phoneNumber: {
          ownerId,
          phoneNumber: this.normalizePhone(phoneNumber),
        },
      },
    })
  }

  async findAll(ownerId: string, query: ContactQueryDto): Promise<{
    data: ContactWithMedico[]
    total: number
  }> {
    const { search, favoritesOnly, blockedOnly, page = 1, limit = 50 } = query

    const where: Prisma.ChatContactWhereInput = { ownerId }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (favoritesOnly) {
      where.isFavorite = true
    }

    if (blockedOnly) {
      where.isBlocked = true
    }

    const [data, total] = await Promise.all([
      this.prisma.chatContact.findMany({
        where,
        include: {
          linkedMedico: {
            select: {
              id: true,
              nome: true,
              email: true,
              telefone: true,
            },
          },
        },
        orderBy: [{ isFavorite: 'desc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.chatContact.count({ where }),
    ])

    return { data, total }
  }

  async update(id: string, data: UpdateContactData): Promise<ChatContact> {
    return this.prisma.chatContact.update({
      where: { id },
      data,
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.chatContact.delete({
      where: { id },
    })
  }

  async toggleFavorite(id: string): Promise<ChatContact> {
    const contact = await this.prisma.chatContact.findUnique({ where: { id } })
    if (!contact) throw new Error('Contact not found')

    return this.prisma.chatContact.update({
      where: { id },
      data: { isFavorite: !contact.isFavorite },
    })
  }

  async toggleBlock(id: string): Promise<ChatContact> {
    const contact = await this.prisma.chatContact.findUnique({ where: { id } })
    if (!contact) throw new Error('Contact not found')

    return this.prisma.chatContact.update({
      where: { id },
      data: { isBlocked: !contact.isBlocked },
    })
  }

  private normalizePhone(phone: string): string {
    let cleaned = phone.replace(/\D/g, '')
    if (!cleaned.startsWith('55')) {
      cleaned = '55' + cleaned
    }
    return cleaned
  }
}
