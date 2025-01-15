declare global {
  interface Window {
    app?: {
      applicationName?: string;
    };
  }
}

import createHttpUserAgent from '@commercetools/http-user-agent';
import {
  buildApiUrl,
  executeHttpClientRequest,
} from '@commercetools-frontend/application-shell';
import { MC_API_PROXY_TARGETS } from '@commercetools-frontend/constants';

interface ApiError extends Error {
  status?: number;
  body?: {
    errors?: Array<{
      message: string;
      code: string;
    }>;
  };
}

class ApiService {
  private userAgent: string;

  constructor() {
    // Initialize user agent as recommended in docs
    this.userAgent = createHttpUserAgent({
      name: 'mc-app-api-client',
      version: '1.0.0', // Should match your app version
      libraryName: window.app?.applicationName || 'mc-app',
      contactEmail: 'support@company.com', // Replace with your support email
    });
  }

  async get(
    options: {
      forwardTo?: string;
    } = {}
  ) {
    try {
      const data = await executeHttpClientRequest(
        async (requestOptions) => {
          const url = buildApiUrl('/proxy/forward-to');

          const res = await fetch(url, requestOptions);

          return {
            data: await res.json(),
            statusCode: res.status,
            getHeader: (key: string) => res.headers.get(key),
          };
        },
        {
          userAgent: this.userAgent,
          ...(options.forwardTo && {
            forwardToConfig: {
              uri: options.forwardTo,
            },
          }),
        }
      );

      return data;
    } catch (error) {
      throw error;
    }
  }

  async post(
    payload: unknown,
    options: {
      forwardTo?: string;
      headers?: Record<string, string>;
    } = {}
  ) {
    try {
      const data = await executeHttpClientRequest(
        async (requestOptions) => {
          const url = buildApiUrl('/proxy/forward-to');

          const res = await fetch(url, {
            ...requestOptions,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...requestOptions.headers,
              ...options.headers,
            },
            body: JSON.stringify(payload),
          });

          return {
            data: await res.json(),
            statusCode: res.status,
            getHeader: (key: string) => res.headers.get(key),
          };
        },
        {
          userAgent: this.userAgent,
          ...(options.forwardTo && {
            forwardToConfig: {
              uri: options.forwardTo,
            },
          }),
        }
      );

      return data;
    } catch (error) {
      throw error;
    }
  }
}

export const apiService = new ApiService();
