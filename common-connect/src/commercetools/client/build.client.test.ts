import { ClientBuilder } from '@commercetools/ts-client';
import { createClient } from './build.client';
import { createAuthMiddlewareOptions } from '../middleware/auth.middleware';
import { createHttpMiddlewareOptions } from '../middleware/http.middleware';
import { readConfiguration } from '../utils/config.utils';

// Mock dependencies
jest.mock('@commercetools/ts-client');
jest.mock('../middleware/auth.middleware');
jest.mock('../middleware/http.middleware');
jest.mock('../utils/config.utils');

describe('createClient', () => {
  const mockConfig = {
    projectKey: 'test-project',
    region: 'test-region',
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    scope: 'test-scope'
  };

  const mockAuthOptions = {
    host: 'test-auth-host',
    projectKey: 'test-project',
    credentials: {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret'
    }
  };

  const mockHttpOptions = {
    host: 'test-api-host',
    httpClient: fetch
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup mock implementations
    (readConfiguration as jest.Mock).mockReturnValue(mockConfig);
    (createAuthMiddlewareOptions as jest.Mock).mockReturnValue(mockAuthOptions);
    (createHttpMiddlewareOptions as jest.Mock).mockReturnValue(mockHttpOptions);

    // Mock the ClientBuilder methods
    const mockBuild = jest.fn().mockReturnValue('mocked-client');
    const mockWithHttpMiddleware = jest.fn().mockReturnThis();
    const mockWithClientCredentialsFlow = jest.fn().mockReturnThis();
    const mockWithProjectKey = jest.fn().mockReturnThis();

    (ClientBuilder as jest.Mock).mockImplementation(() => ({
      build: mockBuild,
      withHttpMiddleware: mockWithHttpMiddleware,
      withClientCredentialsFlow: mockWithClientCredentialsFlow,
      withProjectKey: mockWithProjectKey
    }));
  });

  it('should create a client with correct configuration', () => {
    const client = createClient();

    // Verify ClientBuilder was instantiated
    expect(ClientBuilder).toHaveBeenCalled();

    // Verify configuration was read
    expect(readConfiguration).toHaveBeenCalled();

    // Verify auth middleware was created with correct options
    expect(createAuthMiddlewareOptions).toHaveBeenCalled();

    // Verify http middleware was created with correct region
    expect(createHttpMiddlewareOptions).toHaveBeenCalledWith(mockConfig.region);

    // Verify the client builder chain was called with correct parameters
    const mockClientBuilder = (ClientBuilder as jest.Mock).mock.results[0].value;
    expect(mockClientBuilder.withProjectKey).toHaveBeenCalledWith(mockConfig.projectKey);
    expect(mockClientBuilder.withClientCredentialsFlow).toHaveBeenCalledWith(mockAuthOptions);
    expect(mockClientBuilder.withHttpMiddleware).toHaveBeenCalledWith(mockHttpOptions);
    expect(mockClientBuilder.build).toHaveBeenCalled();

    // Verify the final client is returned
    expect(client).toBe('mocked-client');
  });

  it('should throw an error if configuration is invalid', () => {
    (readConfiguration as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid configuration');
    });

    expect(() => createClient()).toThrow('Invalid configuration');
  });
}); 