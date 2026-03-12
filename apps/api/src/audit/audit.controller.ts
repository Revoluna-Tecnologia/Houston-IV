import { Controller, Get, Query, HttpCode, HttpStatus } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";
import { AuditAction } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { RequirePermissions } from "../auth/decorators";
import { AppPermission } from "../auth/types/auth.types";

class AuditLogQueryDto {
  @IsOptional()
  @IsString()
  resource?: string;

  @IsOptional()
  @IsString()
  resourceId?: string;

  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

@ApiTags("Audit Logs")
@ApiBearerAuth()
@Controller("audit-logs")
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermissions(AppPermission.ROLES_SELECT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Listar logs de auditoria com filtros e paginacao" })
  @ApiResponse({ status: 200, description: "Lista paginada de audit logs" })
  async findAll(@Query() query: AuditLogQueryDto) {
    const {
      resource,
      resourceId,
      action,
      userId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = query;

    const where: Record<string, any> = {};

    if (resource) where.resource = resource;
    if (resourceId) where.resourceId = resourceId;
    if (action) where.action = action;
    if (userId) where.userId = userId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
