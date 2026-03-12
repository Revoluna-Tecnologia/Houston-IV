import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsArray, IsString } from "class-validator";
import { FeatureFlagsService, FeatureFlagValue } from "./feature-flags.service";
import { RequirePermissions } from "../auth/decorators";
import { AppPermission } from "../auth/types/auth.types";

class UpdateFeatureFlagDto {
  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  grupoIds?: string[];
}

@ApiTags("Feature Flags")
@ApiBearerAuth()
@Controller("feature-flags")
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get()
  @RequirePermissions(AppPermission.ROLES_SELECT)
  @ApiOperation({ summary: "Listar todas as feature flags" })
  @ApiResponse({ status: 200, description: "Lista de flags" })
  getAllFlags(): Record<string, FeatureFlagValue> {
    return this.featureFlagsService.getAllFlags();
  }

  @Put(":key")
  @RequirePermissions(AppPermission.ROLES_UPDATE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Atualizar uma feature flag" })
  @ApiResponse({ status: 200, description: "Flag atualizada" })
  updateFlag(
    @Param("key") key: string,
    @Body() dto: UpdateFeatureFlagDto,
  ): { success: true } {
    this.featureFlagsService.setFlag(key, dto.enabled, dto.grupoIds);
    return { success: true };
  }
}
