import { ApiProperty } from "@nestjs/swagger";
import { CandidaturaStatus } from "../../generated/prisma/client";

export class CandidaturaResponseDto {
  @ApiProperty({ example: "uuid-here" })
  id!: string;

  @ApiProperty({ example: "uuid-vaga" })
  vagaId!: string;

  @ApiProperty({ example: "uuid-medico" })
  medicoId!: string;

  @ApiProperty({ enum: ["pendente", "aprovada", "rejeitada"] })
  status!: CandidaturaStatus;

  @ApiProperty({ example: "2024-12-26T00:00:00.000Z" })
  createdAt!: Date;

  @ApiProperty({ example: "2024-12-26T00:00:00.000Z" })
  updatedAt!: Date;
}
