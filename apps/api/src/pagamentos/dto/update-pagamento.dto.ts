import { ApiProperty, PartialType } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { CreatePagamentoDto } from "./create-pagamento.dto";
import { PagamentoStatus } from "../../generated/prisma/client";

export class UpdatePagamentoDto extends PartialType(CreatePagamentoDto) {
  @ApiProperty({ enum: PagamentoStatus, required: false })
  @IsEnum(PagamentoStatus)
  @IsOptional()
  status?: PagamentoStatus;
}
