import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface FeatureFlagValue {
  enabled: boolean;
  grupoIds?: string[];
}

@Injectable()
export class FeatureFlagsService implements OnModuleInit {
  private readonly logger = new Logger(FeatureFlagsService.name);
  private readonly flags = new Map<string, FeatureFlagValue>();

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const raw = this.config.get<string>("FEATURE_FLAGS");
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as Record<string, FeatureFlagValue>;
      for (const [key, value] of Object.entries(parsed)) {
        this.flags.set(key, value);
      }
      this.logger.log(
        `Loaded ${this.flags.size} feature flag(s): ${[...this.flags.keys()].join(", ")}`,
      );
    } catch (err) {
      this.logger.warn("Failed to parse FEATURE_FLAGS env variable", err);
    }
  }

  /**
   * Verifica se uma feature flag está habilitada.
   * Se grupoIds estiver definido na flag, só retorna true para os grupos listados.
   */
  isEnabled(key: string, grupoId?: string): boolean {
    const flag = this.flags.get(key);
    if (!flag) return false;
    if (!flag.enabled) return false;

    // Se a flag tem restrição por grupo, verificar
    if (flag.grupoIds && flag.grupoIds.length > 0) {
      if (!grupoId) return false;
      return flag.grupoIds.includes(grupoId);
    }

    return true;
  }

  /**
   * Define ou atualiza uma feature flag em runtime.
   */
  setFlag(key: string, enabled: boolean, grupoIds?: string[]): void {
    this.flags.set(key, { enabled, grupoIds });
    this.logger.log(
      `Feature flag "${key}" set to ${enabled}${grupoIds ? ` (grupos: ${grupoIds.join(", ")})` : ""}`,
    );
  }

  /**
   * Retorna todas as flags como objeto plano.
   */
  getAllFlags(): Record<string, FeatureFlagValue> {
    const result: Record<string, FeatureFlagValue> = {};
    for (const [key, value] of this.flags.entries()) {
      result[key] = { ...value };
    }
    return result;
  }
}
