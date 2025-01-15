import { type AuthMiddlewareOptions } from '@commercetools/ts-client';
import { readConfiguration } from '../utils/config.utils';
/**
 * Configure Middleware. Example only. Adapt on your own
 */
export const createAuthMiddlewareOptions: () => AuthMiddlewareOptions = () => ({
  host: `https://auth.${readConfiguration().region}.commercetools.com`,
  projectKey: readConfiguration().projectKey,
  credentials: {
    clientId: readConfiguration().clientId,
    clientSecret: readConfiguration().clientSecret,
  },
  scopes: [
    (readConfiguration().scope
      ? readConfiguration().scope
      : 'default') as string,
  ],
});
