import { ApiProperty } from '@nestjs/swagger'

export class GradesResponseDto {
  @ApiProperty()
  gradeId!: string

  @ApiProperty()
  gradeNome!: string

  @ApiProperty()
  hospital!: string

  @ApiProperty()
  setor!: string

  @ApiProperty()
  periodo!: string

  @ApiProperty()
  totalSlots!: number

  @ApiProperty()
  slotsPreenchidos!: number

  @ApiProperty()
  slotsVazios!: number
}
