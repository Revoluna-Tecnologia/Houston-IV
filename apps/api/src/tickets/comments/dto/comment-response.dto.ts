import { ApiProperty } from '@nestjs/swagger'

export class CommentResponseDto {
  @ApiProperty({ example: 'uuid-do-comentario' })
  id!: string

  @ApiProperty({ example: 'Este bug foi corrigido na versao 2.1.0' })
  content!: string

  @ApiProperty({ example: false })
  isInternal!: boolean

  @ApiProperty({ example: 'uuid-do-ticket' })
  ticketId!: string

  @ApiProperty({ example: 'uuid-do-autor' })
  authorId!: string

  @ApiProperty({ example: 'Joao Silva' })
  authorName!: string

  @ApiProperty({ example: '2024-12-20T10:00:00Z' })
  createdAt!: Date

  @ApiProperty({ example: '2024-12-20T15:30:00Z' })
  updatedAt!: Date
}
