import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsObject,
  IsUUID,
} from "class-validator";
import {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
} from "../../generated/prisma/client";

export class CreateNotificationDto {
  @ApiProperty({ description: "ID do usuário destinatário" })
  @IsUUID()
  userId!: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type!: NotificationType;

  @ApiPropertyOptional({ enum: NotificationPriority, default: "normal" })
  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @ApiProperty({ description: "Título da notificação" })
  @IsString()
  title!: string;

  @ApiProperty({ description: "Conteúdo da notificação" })
  @IsString()
  content!: string;

  @ApiPropertyOptional({ description: "Dados adicionais em JSON" })
  @IsObject()
  @IsOptional()
  data?: Record<string, unknown>;

  @ApiPropertyOptional({ enum: NotificationChannel, isArray: true })
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  @IsOptional()
  channels?: NotificationChannel[];

  @ApiPropertyOptional({ description: "ID do grupo" })
  @IsUUID()
  @IsOptional()
  grupoId?: string;
}

export class SendBulkNotificationDto {
  @ApiProperty({
    description: "IDs dos usuários destinatários",
    type: [String],
  })
  @IsArray()
  @IsUUID("4", { each: true })
  userIds!: string[];

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type!: NotificationType;

  @ApiPropertyOptional({ enum: NotificationPriority, default: "normal" })
  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @ApiProperty({ description: "Título da notificação" })
  @IsString()
  title!: string;

  @ApiProperty({ description: "Conteúdo da notificação" })
  @IsString()
  content!: string;

  @ApiPropertyOptional({ description: "Dados adicionais em JSON" })
  @IsObject()
  @IsOptional()
  data?: Record<string, unknown>;

  @ApiPropertyOptional({ description: "ID do grupo" })
  @IsUUID()
  @IsOptional()
  grupoId?: string;
}
