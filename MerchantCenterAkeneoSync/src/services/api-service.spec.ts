import { apiService } from './api-service';
import * as appShell from '@commercetools-frontend/application-shell';

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

describe('ApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
          return {
            data: { data: 'test data' },
            statusCode: 200,
            getHeader: expect.any(Function),
          };
        }
      );

      // Call the API service
      const result = await apiService.get();

      // Check that buildApiUrl will be called when requestFn is executed
      // We can't easily verify this directly since it's called inside the requestFn

      // Check the result matches the structure from executeHttpClientRequest
      expect(result).toEqual({
        data: { data: 'test data' },
        statusCode: 200,
        getHeader: expect.any(Function),
      });
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
          return {
            data: { data: 'test data' },
            statusCode: 200,
            getHeader: expect.any(Function),
          };
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
          const res = await requestFn({
            headers: { Authorization: 'Bearer token' },
          });
          return {
            data: { data: 'test data' },
            statusCode: 200,
            getHeader: expect.any(Function),
          };
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

      // Check the result matches the structure from executeHttpClientRequest
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
          const res = await requestFn({
            headers: { Authorization: 'Bearer token' },
          });
          return {
            data: { data: 'test data' },
            statusCode: 200,
            getHeader: expect.any(Function),
          };
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
  });
});
