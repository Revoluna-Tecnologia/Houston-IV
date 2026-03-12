import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { TicketStatus } from "../../generated/prisma/client";

export class UpdateStatusDto {
  @ApiProperty({ enum: TicketStatus, example: "in_progress" })
  @IsEnum(TicketStatus)
  status!: TicketStatus;
}
