import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNotEmpty } from 'class-validator'

export class MoveCardDto {
  @ApiProperty({ example: 'in_progress' })
  @IsString()
  @IsNotEmpty()
  status!: string
}
