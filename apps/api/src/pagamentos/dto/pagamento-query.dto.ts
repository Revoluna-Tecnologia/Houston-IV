import { ApiProperty } from "@nestjs/swagger";
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { PagamentoStatus } from "../../generated/prisma/client";

export class PagamentoQueryDto {
  @ApiProperty({ example: 1, required: false })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiProperty({ example: 10, required: false })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number;

  @ApiProperty({ example: "createdAt", required: false })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiProperty({ example: "desc", required: false })
  @IsString()
  @IsOptional()
  sortOrder?: "asc" | "desc";

  @ApiProperty({ example: "uuid-vaga", required: false })
  @IsUUID()
  @IsOptional()
  vagaId?: string;

  @ApiProperty({ example: "uuid-medico", required: false })
  @IsUUID()
  @IsOptional()
  medicoId?: string;

  @ApiProperty({ enum: PagamentoStatus, required: false })
  @IsEnum(PagamentoStatus)
  @IsOptional()
  status?: PagamentoStatus;

  @ApiProperty({ example: "2024-01-01", required: false })
  @IsDateString()
  @IsOptional()
  dataInicio?: string;

  @ApiProperty({ example: "2024-12-31", required: false })
  @IsDateString()
  @IsOptional()
  dataFim?: string;
}
