import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { VagaStatus } from "../../generated/prisma/client";

export class UpdateStatusDto {
  @ApiProperty({ enum: ["aberta", "fechada", "cancelada", "anunciada"] })
  @IsEnum(VagaStatus)
  status!: VagaStatus;
}
