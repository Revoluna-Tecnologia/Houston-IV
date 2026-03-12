import { SetMetadata } from "@nestjs/common";

export const FEATURE_FLAG_KEY = "feature_flag";

/**
 * Decorator para marcar rotas que dependem de uma feature flag.
 * Quando a flag estiver desabilitada, o endpoint retorna 404.
 *
 * @example
 * @FeatureFlag('novo-chat')
 * @Get('chat/v2')
 * newChat() {}
 */
export const FeatureFlag = (key: string) => SetMetadata(FEATURE_FLAG_KEY, key);
