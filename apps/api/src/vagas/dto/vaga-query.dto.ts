import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsEnum,
  IsUUID,
  IsDateString,
  IsNumber,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { VagaStatus } from "../../generated/prisma/client";

export class VagaQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ example: "createdAt" })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ["asc", "desc"] })
  @IsOptional()
  @IsString()
  sortOrder?: "asc" | "desc";

  @ApiPropertyOptional({
    enum: ["aberta", "fechada", "cancelada", "anunciada"],
  })
  @IsOptional()
  @IsEnum(VagaStatus)
  status?: VagaStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  hospitalId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  setorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  especialidadeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dataFim?: string;
}
