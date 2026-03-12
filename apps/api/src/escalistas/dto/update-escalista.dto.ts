import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { EscalistaStatus } from "../../generated/prisma/client";

export class UpdateEscalistaDto {
  @ApiProperty({ enum: ["pendente", "ativo", "inativo"] })
  @IsEnum(EscalistaStatus)
  status!: EscalistaStatus;
}
