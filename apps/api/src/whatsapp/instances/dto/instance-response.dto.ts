import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { WhatsAppInstanceStatus } from "../../../generated/prisma/client";

export class InstanceResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  grupoId!: string;

  @ApiProperty()
  provider!: string;

  @ApiProperty()
  providerInstanceId!: string;

  @ApiProperty()
  instanceName!: string;

  @ApiProperty({ enum: WhatsAppInstanceStatus })
  status!: WhatsAppInstanceStatus;

  @ApiPropertyOptional()
  phoneNumber?: string;

  @ApiPropertyOptional()
  metadata?: Record<string, unknown>;

  @ApiProperty()
  createdById!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class QRCodeResponseDto {
  @ApiProperty({ description: "QR Code em formato data URL (base64)" })
  qr!: string;

  @ApiPropertyOptional({ description: "Data de expiração do QR Code" })
  expiresAt?: Date;
}

export class PairingCodeResponseDto {
  @ApiProperty({ description: "Código de pareamento de 8 dígitos" })
  code!: string;

  @ApiPropertyOptional({ description: "Data de expiração do código" })
  expiresAt?: Date;
}

export class ConnectionStatusResponseDto {
  @ApiProperty({ enum: WhatsAppInstanceStatus })
  status!: WhatsAppInstanceStatus;

  @ApiPropertyOptional()
  phoneNumber?: string;

  @ApiProperty()
  isConnected!: boolean;
}
