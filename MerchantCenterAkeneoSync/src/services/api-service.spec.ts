import { apiService } from './api-service';
import * as appShell from '@commercetools-frontend/application-shell';
import createHttpUserAgent from '@commercetools/http-user-agent';

// Mock the HTTP user agent
jest.mock('@commercetools/http-user-agent', () => {
  return jest.fn().mockReturnValue('mocked-user-agent');
});

// Store original references before mocking
const originalBuildApiUrl = appShell.buildApiUrl;
const originalExecuteHttpClientRequest = appShell.executeHttpClientRequest;

// Mock the application shell methods
jest.mock('@commercetools-frontend/application-shell', () => ({
  buildApiUrl: jest
    .fn()
    .mockReturnValue('https://mocked-api-url.com/proxy/forward-to'),
  executeHttpClientRequest: jest.fn(),
}));

// Mock the global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock window.app for testing constructor logic
const originalWindow = { ...window };
const mockWindow = {
  app: {
    applicationName: 'test-app',
  },
};

describe('ApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restore window object
    Object.defineProperty(global, 'window', {
      value: originalWindow,
      writable: true,
    });
  });

  describe('constructor', () => {
    it('should initialize user agent with window.app.applicationName when available', () => {
      // Mock window.app
      Object.defineProperty(global, 'window', {
        value: mockWindow,
        writable: true,
      });

      // Create a new instance to trigger constructor
      const newApiService = new (apiService.constructor as any)();

      expect(createHttpUserAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          libraryName: 'test-app',
        })
      );
    });

    it('should use default libraryName when window.app is not available', () => {
      // Mock window without app property
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true,
      });

      // Create a new instance to trigger constructor
      const newApiService = new (apiService.constructor as any)();

      expect(createHttpUserAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          libraryName: 'mc-app',
        })
      );
    });
  });

  describe('get', () => {
    it('should call fetch with the correct URL and options', async () => {
      // Prepare the mock response
      const mockResponse = {
        json: jest.fn().mockResolvedValue({ data: 'test data' }),
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
      };

      mockFetch.mockResolvedValue(mockResponse);

      // Mock executeHttpClientRequest to call the request function
      (appShell.executeHttpClientRequest as jest.Mock).mockImplementation(
        async (requestFn, options) => {
          // Store the requestFn for later execution
          const result = await requestFn({});
          return result;
        }
      );

      // Call the API service
      const result = await apiService.get();

      // Check buildApiUrl was called
      expect(appShell.buildApiUrl).toHaveBeenCalledWith('/proxy/forward-to');

      // Check fetch was called
      expect(mockFetch).toHaveBeenCalledWith(
        'https://mocked-api-url.com/proxy/forward-to',
        expect.any(Object)
      );

      // Check that the result has the expected structure
      expect(result).toEqual({
        data: { data: 'test data' },
        statusCode: 200,
        getHeader: expect.any(Function),
      });

      // Test the getHeader function
      const getHeaderFn = result.getHeader;
      getHeaderFn('content-type');
      expect(mockResponse.headers.get).toHaveBeenCalledWith('content-type');
    });

    it('should include forwardTo config when provided', async () => {
      // Prepare the mock response
      const mockResponse = {
        json: jest.fn().mockResolvedValue({ data: 'test data' }),
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
      };

      mockFetch.mockResolvedValue(mockResponse);

      // Mock executeHttpClientRequest to capture the options
      let capturedOptions: any;
      (appShell.executeHttpClientRequest as jest.Mock).mockImplementation(
        async (requestFn, options) => {
          capturedOptions = options;
          const result = await requestFn({});
          return result;
        }
      );

      // Call the API service with forwardTo option
      await apiService.get({ forwardTo: 'https://example.com/api' });

      // Check that forwardToConfig was included in the options
      expect(capturedOptions.forwardToConfig).toEqual({
        uri: 'https://example.com/api',
      });
    });

    it('should throw the error when fetch fails', async () => {
      const error = new Error('Network error');

      // Mock executeHttpClientRequest to throw an error
      (appShell.executeHttpClientRequest as jest.Mock).mockRejectedValue(error);

      // Expect the API service to throw the same error
      await expect(apiService.get()).rejects.toThrow('Network error');
    });

    it('should handle response with non-JSON data', async () => {
      // Prepare a mock response that throws on .json()
      const jsonError = new Error('Invalid JSON');
      const mockResponse = {
        json: jest.fn().mockRejectedValue(jsonError),
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('text/plain'),
        },
      };

      mockFetch.mockResolvedValue(mockResponse);

      // Mock executeHttpClientRequest to call the request function
      (appShell.executeHttpClientRequest as jest.Mock).mockImplementation(
        async (requestFn, options) => {
          try {
            return await requestFn({});
          } catch (error) {
            throw error;
          }
        }
      );

      // Expect the API service to throw the JSON error
      await expect(apiService.get()).rejects.toThrow('Invalid JSON');
    });
  });

  describe('post', () => {
    it('should call fetch with the correct URL, method, headers and body', async () => {
      // Prepare the mock response
      const mockResponse = {
        json: jest.fn().mockResolvedValue({ data: 'test data' }),
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
      };

      mockFetch.mockResolvedValue(mockResponse);

      // Mock executeHttpClientRequest to capture the fetch call
      let capturedFetchOptions: any;
      (appShell.executeHttpClientRequest as jest.Mock).mockImplementation(
        async (requestFn) => {
          const result = await requestFn({
            headers: { Authorization: 'Bearer token' },
          });
          return result;
        }
      );

      // The payload to send
      const payload = { key: 'value' };

      // Call the API service
      const result = await apiService.post(payload);

      // Get the fetch call arguments
      const fetchArgs = mockFetch.mock.calls[0];
      const [url, options] = fetchArgs;
      capturedFetchOptions = options;

      // Check the URL
      expect(url).toBe('https://mocked-api-url.com/proxy/forward-to');

      // Check the method
      expect(capturedFetchOptions.method).toBe('POST');

      // Check the headers
      expect(capturedFetchOptions.headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: 'Bearer token',
      });

      // Check the body
      expect(capturedFetchOptions.body).toBe(JSON.stringify(payload));

      // Check the result has the expected structure
      expect(result).toEqual({
        data: { data: 'test data' },
        statusCode: 200,
        getHeader: expect.any(Function),
      });
    });

    it('should include custom headers when provided', async () => {
      // Prepare the mock response
      const mockResponse = {
        json: jest.fn().mockResolvedValue({ data: 'test data' }),
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
      };

      mockFetch.mockResolvedValue(mockResponse);

      // Mock executeHttpClientRequest
      (appShell.executeHttpClientRequest as jest.Mock).mockImplementation(
        async (requestFn) => {
          const result = await requestFn({
            headers: { Authorization: 'Bearer token' },
          });
          return result;
        }
      );

      // The payload and custom headers
      const payload = { key: 'value' };
      const customHeaders = { 'X-Custom-Header': 'custom-value' };

      // Call the API service with custom headers
      await apiService.post(payload, { headers: customHeaders });

      // Get the fetch call arguments
      const [, options] = mockFetch.mock.calls[0];

      // Check the headers include the custom header
      expect(options.headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: 'Bearer token',
        'X-Custom-Header': 'custom-value',
      });
    });

    it('should include forwardTo config when provided for post', async () => {
      // Prepare the mock response
      const mockResponse = {
        json: jest.fn().mockResolvedValue({ data: 'test data' }),
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
      };

      mockFetch.mockResolvedValue(mockResponse);

      // Mock executeHttpClientRequest to capture the options
      let capturedOptions: any;
      (appShell.executeHttpClientRequest as jest.Mock).mockImplementation(
        async (requestFn, options) => {
          capturedOptions = options;
          const result = await requestFn({
            headers: {},
          });
          return result;
        }
      );

      // Call the API service with forwardTo option
      await apiService.post({}, { forwardTo: 'https://example.com/api' });

      // Check that forwardToConfig was included in the options
      expect(capturedOptions.forwardToConfig).toEqual({
        uri: 'https://example.com/api',
      });
    });

    it('should throw the error when post fails', async () => {
      const error = new Error('Network error');

      // Mock executeHttpClientRequest to throw an error
      (appShell.executeHttpClientRequest as jest.Mock).mockRejectedValue(error);

      // Expect the API service to throw the same error
      await expect(apiService.post({})).rejects.toThrow('Network error');
    });
  });
});
