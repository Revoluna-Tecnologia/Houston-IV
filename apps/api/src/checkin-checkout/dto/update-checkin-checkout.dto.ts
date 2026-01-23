import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

export class UpdateCheckinCheckoutDto {
  @ApiProperty({ example: 'Observacoes atualizadas', required: false })
  @IsString()
  @IsOptional()
  observacoes?: string
}
