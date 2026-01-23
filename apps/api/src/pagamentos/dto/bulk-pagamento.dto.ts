import { ApiProperty } from '@nestjs/swagger'
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator'

export class BulkPagamentoDto {
  @ApiProperty({ example: ['uuid-1', 'uuid-2', 'uuid-3'], type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  ids!: string[]
}
