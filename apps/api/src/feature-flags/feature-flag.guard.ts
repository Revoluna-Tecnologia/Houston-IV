import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { FEATURE_FLAG_KEY } from "./feature-flag.decorator";
import { FeatureFlagsService } from "./feature-flags.service";

/**
 * Guard que bloqueia acesso quando uma feature flag está desabilitada.
 * Retorna 404 (não 403) para não revelar a existência da feature.
 *
 * Uso: aplique o decorator @FeatureFlag('key') no controller ou handler,
 * e registre este guard localmente com @UseGuards(FeatureFlagGuard).
 */
@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly featureFlags: FeatureFlagsService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const flagKey = this.reflector.getAllAndOverride<string>(FEATURE_FLAG_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Se nenhuma flag foi definida, permitir acesso
    if (!flagKey) return true;

    // Tentar obter grupoId do request (se o user estiver autenticado)
    const request = context.switchToHttp().getRequest();
    const grupoId = request.user?.grupoIds?.[0];

    if (!this.featureFlags.isEnabled(flagKey, grupoId)) {
      throw new NotFoundException();
    }

    return true;
  }
}
