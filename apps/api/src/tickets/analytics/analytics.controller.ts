import { Controller, Get, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { AnalyticsService } from './analytics.service'
import { AnalyticsQueryDto, TicketAnalyticsResponseDto } from './dto'
import { RequirePermissions } from '../../auth/decorators'
import { AppPermission } from '../../auth/types/auth.types'

@ApiTags('Tickets Analytics')
@ApiBearerAuth()
@Controller('tickets/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  @RequirePermissions(AppPermission.TICKETS_SELECT)
  @ApiOperation({ summary: 'Obter metricas e analytics de tickets' })
  @ApiResponse({ status: 200, type: TicketAnalyticsResponseDto })
  getAnalytics(@Query() query: AnalyticsQueryDto): Promise<TicketAnalyticsResponseDto> {
    return this.analyticsService.getAnalytics(query)
  }
}
