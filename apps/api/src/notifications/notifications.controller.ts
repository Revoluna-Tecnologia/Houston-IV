import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { NotificationsService } from './notifications.service'
import {
  NotificationQueryDto,
  UpdatePreferenceDto,
  BulkUpdatePreferencesDto,
  NotificationResponseDto,
  NotificationPaginatedResponseDto,
  UnreadCountResponseDto,
  PreferenceResponseDto,
} from './dto'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { RequirePermissions } from '../auth/decorators/permissions.decorator'
import { AppPermission, AuthenticatedUser } from '../auth/types/auth.types'

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  @RequirePermissions(AppPermission.NOTIFICATIONS_SELECT)
  @ApiOperation({ summary: 'Listar notificações do usuário' })
  @ApiResponse({ status: 200, type: NotificationPaginatedResponseDto })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: NotificationQueryDto,
  ): Promise<NotificationPaginatedResponseDto> {
    return this.service.findByUser(user.id, query)
  }

  @Get('unread-count')
  @RequirePermissions(AppPermission.NOTIFICATIONS_SELECT)
  @ApiOperation({ summary: 'Contar notificações não lidas' })
  @ApiResponse({ status: 200, type: UnreadCountResponseDto })
  async countUnread(@CurrentUser() user: AuthenticatedUser): Promise<UnreadCountResponseDto> {
    const count = await this.service.countUnread(user.id)
    return { count }
  }

  @Patch(':id/read')
  @RequirePermissions(AppPermission.NOTIFICATIONS_UPDATE)
  @ApiOperation({ summary: 'Marcar notificação como lida' })
  @ApiResponse({ status: 200, type: NotificationResponseDto })
  async markAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<NotificationResponseDto> {
    return this.service.markAsRead(user.id, id)
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(AppPermission.NOTIFICATIONS_UPDATE)
  @ApiOperation({ summary: 'Marcar todas as notificações como lidas' })
  @ApiResponse({ status: 200, description: 'Quantidade de notificações marcadas' })
  async markAllAsRead(@CurrentUser() user: AuthenticatedUser): Promise<{ count: number }> {
    const count = await this.service.markAllAsRead(user.id)
    return { count }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(AppPermission.NOTIFICATIONS_UPDATE)
  @ApiOperation({ summary: 'Excluir notificação' })
  @ApiResponse({ status: 204 })
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.service.delete(user.id, id)
  }

  @Get('preferences')
  @RequirePermissions(AppPermission.NOTIFICATIONS_SELECT)
  @ApiOperation({ summary: 'Listar preferências de notificação' })
  @ApiResponse({ status: 200, type: [PreferenceResponseDto] })
  async getPreferences(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PreferenceResponseDto[]> {
    return this.service.getPreferences(user.id)
  }

  @Patch('preferences')
  @RequirePermissions(AppPermission.NOTIFICATIONS_UPDATE)
  @ApiOperation({ summary: 'Atualizar preferência de notificação' })
  @ApiResponse({ status: 200, type: PreferenceResponseDto })
  async updatePreference(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePreferenceDto,
  ): Promise<PreferenceResponseDto> {
    return this.service.updatePreference(user.id, dto)
  }

  @Post('preferences/bulk')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(AppPermission.NOTIFICATIONS_UPDATE)
  @ApiOperation({ summary: 'Atualizar múltiplas preferências' })
  @ApiResponse({ status: 200, type: [PreferenceResponseDto] })
  async updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BulkUpdatePreferencesDto,
  ): Promise<PreferenceResponseDto[]> {
    return this.service.updatePreferences(user.id, dto.preferences)
  }
}
