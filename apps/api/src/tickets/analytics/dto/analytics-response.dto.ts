import { ApiProperty } from '@nestjs/swagger'

export class StatusCountDto {
  @ApiProperty()
  open!: number

  @ApiProperty()
  in_review!: number

  @ApiProperty()
  in_progress!: number

  @ApiProperty()
  resolved!: number

  @ApiProperty()
  closed!: number
}

export class PriorityCountDto {
  @ApiProperty()
  low!: number

  @ApiProperty()
  medium!: number

  @ApiProperty()
  high!: number

  @ApiProperty()
  critical!: number
}

export class CategoryCountDto {
  @ApiProperty()
  ui!: number

  @ApiProperty()
  functionality!: number

  @ApiProperty()
  performance!: number

  @ApiProperty()
  security!: number

  @ApiProperty()
  api!: number

  @ApiProperty()
  other!: number
}

export class SectorCountDto {
  @ApiProperty()
  dev!: number

  @ApiProperty()
  comercial!: number

  @ApiProperty()
  prompters!: number
}

export class TimelineDataPointDto {
  @ApiProperty()
  date!: string

  @ApiProperty()
  created!: number

  @ApiProperty()
  resolved!: number
}

export class SlaMetricsDto {
  @ApiProperty()
  total!: number

  @ApiProperty()
  breached!: number

  @ApiProperty()
  atRisk!: number

  @ApiProperty()
  onTrack!: number

  @ApiProperty()
  breachRate!: number
}

export class AssigneeMetricsDto {
  @ApiProperty()
  assigneeId!: string

  @ApiProperty()
  assigneeName!: string

  @ApiProperty()
  total!: number

  @ApiProperty()
  open!: number

  @ApiProperty()
  resolved!: number

  @ApiProperty()
  avgResolutionTimeHours!: number | null
}

export class TicketAnalyticsResponseDto {
  @ApiProperty()
  totalTickets!: number

  @ApiProperty()
  openTickets!: number

  @ApiProperty()
  resolvedTickets!: number

  @ApiProperty()
  avgResolutionTimeHours!: number | null

  @ApiProperty({ type: StatusCountDto })
  byStatus!: StatusCountDto

  @ApiProperty({ type: PriorityCountDto })
  byPriority!: PriorityCountDto

  @ApiProperty({ type: CategoryCountDto })
  byCategory!: CategoryCountDto

  @ApiProperty({ type: SectorCountDto })
  bySector!: SectorCountDto

  @ApiProperty({ type: [TimelineDataPointDto] })
  timeline!: TimelineDataPointDto[]

  @ApiProperty({ type: SlaMetricsDto })
  slaMetrics!: SlaMetricsDto

  @ApiProperty({ type: [AssigneeMetricsDto] })
  topAssignees!: AssigneeMetricsDto[]
}
