import { ApiProperty } from '@nestjs/swagger'

export class AttachmentResponseDto {
  @ApiProperty({ example: 'uuid-do-anexo' })
  id!: string

  @ApiProperty({ example: 'screenshot-2024.png' })
  filename!: string

  @ApiProperty({ example: 'Screenshot do Bug.png' })
  originalName!: string

  @ApiProperty({ example: 'image/png' })
  mimeType!: string

  @ApiProperty({ example: 102400 })
  size!: number

  @ApiProperty({ example: 'https://storage.com/uploads/screenshot-2024.png' })
  url!: string

  @ApiProperty({ example: 'uploads/tickets/uuid/screenshot-2024.png' })
  key!: string

  @ApiProperty({ example: 'uuid-do-ticket' })
  ticketId!: string

  @ApiProperty({ example: '2024-12-20T10:00:00Z' })
  createdAt!: Date
}
