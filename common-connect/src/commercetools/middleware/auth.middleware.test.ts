import { createAuthMiddlewareOptions } from './auth.middleware';
import { readConfiguration } from '../utils/config.utils';

// Mock the config utils module
jest.mock('../utils/config.utils');

describe('Auth Middleware', () => {
  const mockReadConfiguration = readConfiguration as jest.MockedFunction<typeof readConfiguration>;
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should create auth middleware options with correct configuration', () => {
    // Mock configuration
    const mockConfig = {
      region: 'eu-west-1',
      projectKey: 'test-project',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      scope: 'test-scope'
    };
    
    mockReadConfiguration.mockReturnValue(mockConfig);

    const options = createAuthMiddlewareOptions();

    expect(options).toEqual({
      host: 'https://auth.eu-west-1.commercetools.com',
      projectKey: 'test-project',
      credentials: {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
      },
      scopes: ['test-scope']
    });

    expect(mockReadConfiguration).toHaveBeenCalled();
  });

  it('should use default scope when scope is not provided', () => {
    // Mock configuration with undefined scope
    const mockConfig = {
      region: 'eu-west-1',
      projectKey: 'test-project',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      scope: undefined
    };
    
    mockReadConfiguration.mockReturnValue(mockConfig);

    const options = createAuthMiddlewareOptions();

    expect(options.scopes).toEqual(['default']);
    expect(mockReadConfiguration).toHaveBeenCalled();
  });
}); 