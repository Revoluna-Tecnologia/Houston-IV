import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL as string,
    });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log("Database connection established");
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log("Database connection closed");
  }

  /**
   * Returns the base where clause for soft-deletable models.
   * Use in repositories: where: { ...filters, ...this.prisma.notDeleted() }
   */
  notDeleted() {
    return { deletedAt: null } as const;
  }

  /**
   * Returns the data for a soft delete operation.
   * Use in repositories: data: this.prisma.softDeleteData(userId)
   */
  softDeleteData(deletedBy?: string) {
    return {
      deletedAt: new Date(),
      ...(deletedBy ? { deletedBy } : {}),
    };
  }
}
