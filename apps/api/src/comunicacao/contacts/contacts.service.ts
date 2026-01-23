/**
 * Contacts Service
 * Lógica de negócio para gerenciamento de contatos
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common'
import { ContactsRepository } from './contacts.repository'
import {
  CreateContactDto,
  UpdateContactDto,
  ContactQueryDto,
  ContactResponseDto,
  ContactListResponseDto,
} from './dto'
import { AuthenticatedUser } from '../../auth/types/auth.types'

@Injectable()
export class ContactsService {
  constructor(private readonly repository: ContactsRepository) {}

  async create(
    dto: CreateContactDto,
    user: AuthenticatedUser
  ): Promise<ContactResponseDto> {
    // Verificar se já existe contato com esse telefone
    const existing = await this.repository.findByOwnerAndPhone(user.id, dto.phoneNumber)
    if (existing) {
      throw new ConflictException('Contato com esse telefone já existe')
    }

    const contact = await this.repository.create({
      ownerId: user.id,
      name: dto.name,
      phoneNumber: dto.phoneNumber,
      email: dto.email,
      avatarUrl: dto.avatarUrl,
      linkedUserId: dto.linkedUserId,
      linkedMedicoId: dto.linkedMedicoId,
      isFavorite: dto.isFavorite,
      notes: dto.notes,
    })

    return this.toResponseDto(contact)
  }

  async findAll(
    query: ContactQueryDto,
    user: AuthenticatedUser
  ): Promise<ContactListResponseDto> {
    const result = await this.repository.findAll(user.id, query)

    return {
      data: result.data.map((c) => this.toResponseDto(c)),
      total: result.total,
    }
  }

  async findOne(id: string, user: AuthenticatedUser): Promise<ContactResponseDto> {
    const contact = await this.findContactOrFail(id, user)
    return this.toResponseDto(contact)
  }

  async update(
    id: string,
    dto: UpdateContactDto,
    user: AuthenticatedUser
  ): Promise<ContactResponseDto> {
    await this.findContactOrFail(id, user)

    const updated = await this.repository.update(id, {
      name: dto.name,
      email: dto.email,
      avatarUrl: dto.avatarUrl,
      linkedMedicoId: dto.linkedMedicoId,
      isFavorite: dto.isFavorite,
      isBlocked: dto.isBlocked,
      notes: dto.notes,
    })

    return this.toResponseDto(updated)
  }

  async delete(id: string, user: AuthenticatedUser): Promise<void> {
    await this.findContactOrFail(id, user)
    await this.repository.delete(id)
  }

  async toggleFavorite(id: string, user: AuthenticatedUser): Promise<ContactResponseDto> {
    await this.findContactOrFail(id, user)
    const updated = await this.repository.toggleFavorite(id)
    return this.toResponseDto(updated)
  }

  async toggleBlock(id: string, user: AuthenticatedUser): Promise<ContactResponseDto> {
    await this.findContactOrFail(id, user)
    const updated = await this.repository.toggleBlock(id)
    return this.toResponseDto(updated)
  }

  // === Private Methods ===

  private async findContactOrFail(id: string, user: AuthenticatedUser) {
    const contact = await this.repository.findById(id)
    if (!contact) {
      throw new NotFoundException('Contato não encontrado')
    }

    if (contact.ownerId !== user.id) {
      throw new ForbiddenException('Sem acesso ao contato')
    }

    return contact
  }

  private toResponseDto(contact: {
    id: string
    ownerId: string
    name: string
    phoneNumber: string
    email: string | null
    avatarUrl: string | null
    linkedUserId: string | null
    linkedMedicoId: string | null
    isFavorite: boolean
    isBlocked: boolean
    notes: string | null
    createdAt: Date
    updatedAt: Date
    linkedMedico?: { id: string; nome: string } | null
  }): ContactResponseDto {
    return {
      id: contact.id,
      ownerId: contact.ownerId,
      name: contact.name,
      phoneNumber: contact.phoneNumber,
      email: contact.email || undefined,
      avatarUrl: contact.avatarUrl || undefined,
      linkedUserId: contact.linkedUserId || undefined,
      linkedMedicoId: contact.linkedMedicoId || undefined,
      linkedMedicoName: contact.linkedMedico?.nome,
      isFavorite: contact.isFavorite,
      isBlocked: contact.isBlocked,
      notes: contact.notes || undefined,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
    }
  }
}
