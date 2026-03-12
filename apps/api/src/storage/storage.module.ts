import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { HttpModule } from "@nestjs/axios";
import { StorageService } from "./storage.service";
import { STORAGE_PROVIDER } from "./providers/storage-provider.interface";
import { LocalStorageProvider } from "./providers/local-storage.provider";
import { R2StorageProvider } from "./providers/r2-storage.provider";

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  providers: [
    {
      provide: STORAGE_PROVIDER,
      useFactory: (configService: ConfigService) => {
        const provider = configService.get<string>("STORAGE_PROVIDER", "local");
        if (provider === "r2") {
          return new R2StorageProvider(configService);
        }
        return new LocalStorageProvider(configService);
      },
      inject: [ConfigService],
    },
    StorageService,
  ],
  exports: [StorageService, STORAGE_PROVIDER],
})
export class StorageModule {}
