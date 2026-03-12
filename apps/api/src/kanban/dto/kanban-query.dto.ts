import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsOptional,
  IsEnum,
  IsString,
  IsUUID,
  IsBoolean,
} from "class-validator";
import { Transform } from "class-transformer";
import { KanbanTab } from "../../generated/prisma/client";

export class KanbanQueryDto {
  @ApiPropertyOptional({ enum: KanbanTab })
  @IsOptional()
  @IsEnum(KanbanTab)
  tab?: KanbanTab;

  @ApiPropertyOptional({ example: "in_progress" })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: "uuid-do-grupo" })
  @IsOptional()
  @IsUUID()
  grupoId?: string;

  @ApiPropertyOptional({ example: "uuid-do-responsavel" })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  includeDeleted?: boolean;

  @ApiPropertyOptional({ example: "feature" })
  @IsOptional()
  @IsString()
  search?: string;
}
