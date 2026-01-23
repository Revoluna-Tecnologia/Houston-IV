import { ApiProperty } from '@nestjs/swagger'

export class FiltroOpcaoDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  nome!: string
}

export class MesOpcaoDto {
  @ApiProperty()
  valor!: string

  @ApiProperty()
  label!: string
}

export class FiltrosDisponiveisResponseDto {
  @ApiProperty({ type: [FiltroOpcaoDto] })
  hospitais!: FiltroOpcaoDto[]

  @ApiProperty({ type: [FiltroOpcaoDto] })
  setores!: FiltroOpcaoDto[]

  @ApiProperty({ type: [FiltroOpcaoDto] })
  medicos!: FiltroOpcaoDto[]

  @ApiProperty({ type: [MesOpcaoDto] })
  meses!: MesOpcaoDto[]
}
