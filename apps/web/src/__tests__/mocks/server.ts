import { setupServer } from 'msw/node';
import { handlers } from './handlers';
import { comunicacaoHandlers } from '../../services/comunicacao/__tests__/mocks/handlers';

export const server = setupServer(...handlers, ...comunicacaoHandlers);
