import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsEnum,
  IsString,
  IsOptional,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  IsUUID,
  Matches,
  ValidateIf,
} from 'class-validator'
import { ConversationType } from '../../types'

export class CreateConversationDto {
  @ApiProperty({
    enum: ConversationType,
    description: 'Tipo da conversa: direct (1:1) ou group',
    example: 'direct',
  })
  @IsEnum(ConversationType)
  type!: ConversationType

  @ApiPropertyOptional({
    description: 'Nome do grupo (obrigatório para type=group)',
    example: 'Plantão UTI - Janeiro',
  })
  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.type === 'group')
  @IsNotEmpty({ message: 'Nome é obrigatório para grupos' })
  name?: string

  @ApiProperty({
    description: 'ID do grupo ao qual a conversa pertence',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  grupoId!: string

  @ApiProperty({
    description: 'Telefones dos participantes (formato: +55XXXXXXXXXXX ou XXXXXXXXXXX)',
    type: [String],
    example: ['+5511999998888', '5521988887777'],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Pelo menos um participante é obrigatório' })
  @IsString({ each: true })
  @Matches(/^\+?[1-9]\d{10,14}$/, {
    each: true,
    message: 'Telefone inválido. Use formato: +5511999998888',
  })
  participantPhones!: string[]

  @ApiPropertyOptional({
    description: 'IDs de médicos participantes (opcional, vincula automaticamente)',
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174001'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  participantMedicoIds?: string[]
}
