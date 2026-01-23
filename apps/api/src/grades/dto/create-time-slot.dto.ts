import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsDateString, IsOptional, IsString, IsUUID, Matches } from 'class-validator'

export class CreateTimeSlotDto {
  @ApiProperty({ example: '2025-01-15' })
  @IsDateString()
  data!: string

  @ApiProperty({ example: '08:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'horaInicio deve estar no formato HH:mm' })
  horaInicio!: string

  @ApiProperty({ example: '12:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'horaFim deve estar no formato HH:mm' })
  horaFim!: string

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  medicoId?: string
}

export class CreateTimeSlotsDto {
  @ApiProperty({ type: [CreateTimeSlotDto] })
  timeSlots!: CreateTimeSlotDto[]
}
