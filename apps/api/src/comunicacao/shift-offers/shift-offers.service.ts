/**
 * ShiftOffers Service
 * Lógica de negócio para ofertas de plantão via chat
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { ShiftOfferStatus, MessageType } from '@prisma/client'
import { ShiftOffersRepository, ShiftOfferWithRelations } from './shift-offers.repository'
import { MessagesService } from '../messages/messages.service'
import {
  CreateShiftOfferDto,
  RespondShiftOfferDto,
  ShiftOfferQueryDto,
  ShiftOfferResponseDto,
  ShiftOfferListResponseDto,
} from './dto'
import { AuthenticatedUser } from '../../auth/types/auth.types'

@Injectable()
export class ShiftOffersService {
  private readonly logger = new Logger(ShiftOffersService.name)

  constructor(
    private readonly repository: ShiftOffersRepository,
    private readonly messagesService: MessagesService
  ) {}

  async create(
    dto: CreateShiftOfferDto,
    user: AuthenticatedUser
  ): Promise<ShiftOfferResponseDto> {
    // Validar destinatário
    if (!dto.recipientMedicoId && !dto.recipientPhone) {
      throw new BadRequestException('Informe o médico ou telefone do destinatário')
    }

    const recipientPhone = dto.recipientPhone || ''

    // Definir expiração (padrão: 24 horas)
    const expiresAt = dto.expiresAt
      ? new Date(dto.expiresAt)
      : new Date(Date.now() + 24 * 60 * 60 * 1000)

    // Criar oferta
    const offer = await this.repository.create({
      vagaId: dto.vagaId,
      senderId: user.id,
      recipientMedicoId: dto.recipientMedicoId,
      recipientPhone,
      expiresAt,
    })

    // Buscar oferta com relações para montar mensagem
    const offerWithRelations = await this.repository.findById(offer.id)
    if (!offerWithRelations) {
      throw new Error('Oferta criada mas não encontrada')
    }

    // Criar mensagem na conversa
    const messageContent = this.buildOfferMessage(offerWithRelations, dto.customMessage)

    const message = await this.messagesService.send(
      {
        conversationId: dto.conversationId,
        content: messageContent,
        messageType: MessageType.shift_offer,
        metadata: {
          shiftOfferId: offer.id,
          vagaId: dto.vagaId,
        },
      },
      user
    )

    // Atualizar oferta com ID da mensagem
    await this.repository.updateMessageId(offer.id, message.id)

    this.logger.log(`Shift offer ${offer.id} created for vaga ${dto.vagaId}`)

    return this.toResponseDto(offerWithRelations, user.id)
  }

  async findAll(
    query: ShiftOfferQueryDto,
    user: AuthenticatedUser
  ): Promise<ShiftOfferListResponseDto> {
    const result = await this.repository.findAll(user.id, query)

    return {
      data: result.data.map((o) => this.toResponseDto(o, user.id)),
      total: result.total,
    }
  }

  async findOne(id: string, user: AuthenticatedUser): Promise<ShiftOfferResponseDto> {
    const offer = await this.findOfferOrFail(id)

    // Verificar acesso
    if (
      offer.senderId !== user.id &&
      offer.recipientId !== user.id &&
      offer.recipientMedicoId !== user.id
    ) {
      throw new ForbiddenException('Sem acesso à oferta')
    }

    return this.toResponseDto(offer, user.id)
  }

  async respond(
    id: string,
    dto: RespondShiftOfferDto,
    user: AuthenticatedUser
  ): Promise<ShiftOfferResponseDto> {
    const offer = await this.findOfferOrFail(id)

    // Verificar se é o destinatário
    if (offer.recipientId !== user.id && offer.recipientMedicoId !== user.id) {
      throw new ForbiddenException('Apenas o destinatário pode responder')
    }

    // Verificar se ainda está pendente
    if (offer.status !== ShiftOfferStatus.pending) {
      throw new BadRequestException('Oferta não está mais pendente')
    }

    // Verificar se expirou
    if (offer.expiresAt < new Date()) {
      await this.repository.updateStatus(id, ShiftOfferStatus.expired)
      throw new BadRequestException('Oferta expirada')
    }

    // Atualizar status
    const newStatus =
      dto.action === 'accept' ? ShiftOfferStatus.accepted : ShiftOfferStatus.rejected

    await this.repository.updateStatus(id, newStatus, new Date())

    this.logger.log(`Shift offer ${id} ${dto.action}ed by ${user.id}`)

    // Enviar mensagem de resposta na conversa
    if (offer.conversationId) {
      try {
        const statusText = dto.action === 'accept' ? 'aceita' : 'recusada'
        await this.messagesService.send(
          {
            conversationId: offer.conversationId,
            content: `Oferta de plantão ${statusText}.`,
            messageType: MessageType.system,
          },
          user,
        )
        this.logger.log(`Mensagem de resposta enviada para conversa ${offer.conversationId}`)
      } catch (error) {
        this.logger.warn(`Falha ao enviar mensagem de resposta: ${error}`)
      }
    }

    const updated = await this.repository.findById(id)
    return this.toResponseDto(updated!, user.id)
  }

  async cancel(id: string, user: AuthenticatedUser): Promise<void> {
    const offer = await this.findOfferOrFail(id)

    // Apenas o remetente pode cancelar
    if (offer.senderId !== user.id) {
      throw new ForbiddenException('Apenas o remetente pode cancelar')
    }

    // Verificar se ainda está pendente
    if (offer.status !== ShiftOfferStatus.pending) {
      throw new BadRequestException('Oferta não está mais pendente')
    }

    await this.repository.cancel(id)

    this.logger.log(`Shift offer ${id} cancelled by ${user.id}`)
  }

  async expirePending(): Promise<number> {
    const count = await this.repository.expirePendingOffers()
    if (count > 0) {
      this.logger.log(`Expired ${count} pending shift offers`)
    }
    return count
  }

  // === Private Methods ===

  private async findOfferOrFail(id: string): Promise<ShiftOfferWithRelations> {
    const offer = await this.repository.findById(id)
    if (!offer) {
      throw new NotFoundException('Oferta não encontrada')
    }
    return offer
  }

  private buildOfferMessage(
    offer: ShiftOfferWithRelations,
    customMessage?: string
  ): string {
    const vaga = offer.vaga
    const dataFormatada = new Date(vaga.data).toLocaleDateString('pt-BR')
    const horario = vaga.horaInicio && vaga.horaFim
      ? `${vaga.horaInicio} - ${vaga.horaFim}`
      : 'A definir'
    const valor = vaga.valor
      ? `R$ ${Number(vaga.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      : 'A combinar'

    let message = `*Oferta de Plantao*\n\n`
    message += `Data: ${dataFormatada}\n`
    message += `Horario: ${horario}\n`
    message += `Valor: ${valor}\n`

    if (vaga.hospital?.nome) {
      message += `Hospital: ${vaga.hospital.nome}\n`
    }
    if (vaga.setor?.nome) {
      message += `Setor: ${vaga.setor.nome}\n`
    }
    if (vaga.especialidade?.nome) {
      message += `Especialidade: ${vaga.especialidade.nome}\n`
    }

    if (customMessage) {
      message += `\n${customMessage}`
    }

    message += `\n\n_Responda ACEITO ou RECUSO_`

    return message
  }

  private toResponseDto(
    offer: ShiftOfferWithRelations,
    currentUserId: string
  ): ShiftOfferResponseDto {
    const isExpired = offer.expiresAt < new Date()
    const canRespond =
      offer.status === ShiftOfferStatus.pending &&
      !isExpired &&
      (offer.recipientId === currentUserId || offer.recipientMedicoId === currentUserId)

    return {
      id: offer.id,
      vagaId: offer.vagaId,
      vaga: {
        id: offer.vaga.id,
        data: offer.vaga.data,
        horaInicio: offer.vaga.horaInicio || undefined,
        horaFim: offer.vaga.horaFim || undefined,
        valor: offer.vaga.valor ? Number(offer.vaga.valor) : undefined,
        hospitalNome: offer.vaga.hospital?.nome,
        setorNome: offer.vaga.setor?.nome,
        especialidadeNome: offer.vaga.especialidade?.nome,
      },
      messageId: offer.messageId || undefined,
      senderId: offer.senderId,
      recipientId: offer.recipientId || undefined,
      recipientMedicoId: offer.recipientMedicoId || undefined,
      recipientMedicoName: offer.recipientMedico?.nome,
      recipientPhone: offer.recipientPhone,
      status: offer.status,
      expiresAt: offer.expiresAt,
      createdAt: offer.createdAt,
      respondedAt: offer.respondedAt || undefined,
      isExpired,
      canRespond,
    }
  }
}
