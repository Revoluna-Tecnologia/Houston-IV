import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  TicketStatus,
  TicketPriority,
  TicketCategory,
  TicketType,
  TicketSector,
} from "../../generated/prisma/client";

export class TicketResponseDto {
  @ApiProperty({ example: "uuid-do-ticket" })
  id!: string;

  @ApiProperty({ example: "Bug no formulário de login" })
  title!: string;

  @ApiProperty({ example: "O botão de login não responde" })
  description!: string;

  @ApiProperty({ enum: TicketStatus, example: "open" })
  status!: TicketStatus;

  @ApiProperty({ enum: TicketPriority, example: "high" })
  priority!: TicketPriority;

  @ApiProperty({ enum: TicketCategory, example: "functionality" })
  category!: TicketCategory;

  @ApiProperty({ enum: TicketType, example: "bug" })
  type!: TicketType;

  @ApiProperty({ enum: TicketSector, example: "dev" })
  sector!: TicketSector;

  @ApiPropertyOptional({ example: "/dashboard/login" })
  location!: string | null;

  @ApiPropertyOptional({ example: "1. Acessar /login\n2. Preencher dados" })
  reproductionSteps!: string | null;

  @ApiProperty({ type: [String], example: ["https://storage.com/img.png"] })
  screenshots!: string[];

  @ApiProperty({ type: [String], example: ["urgent", "frontend"] })
  tags!: string[];

  @ApiPropertyOptional({ example: "2024-12-31T23:59:59Z" })
  slaDeadline!: Date | null;

  @ApiProperty({ example: false })
  slaBreach!: boolean;

  @ApiProperty({ example: false })
  archived!: boolean;

  @ApiPropertyOptional({ example: "2024-12-25T10:00:00Z" })
  resolvedAt!: Date | null;

  @ApiPropertyOptional({ example: "2024-12-26T10:00:00Z" })
  closedAt!: Date | null;

  @ApiProperty({ example: "uuid-do-criador" })
  createdById!: string;

  @ApiPropertyOptional({ example: "uuid-do-atribuido" })
  assignedToId!: string | null;

  @ApiProperty({ example: "uuid-do-grupo" })
  grupoId!: string;

  @ApiProperty({ example: "2024-12-20T10:00:00Z" })
  createdAt!: Date;

  @ApiProperty({ example: "2024-12-20T15:30:00Z" })
  updatedAt!: Date;

  @ApiPropertyOptional({ example: 0 })
  commentsCount?: number;

  @ApiPropertyOptional({ example: 0 })
  attachmentsCount?: number;
}
