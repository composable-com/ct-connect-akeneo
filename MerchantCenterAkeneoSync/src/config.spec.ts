import { getApiUrl, API_ENDPOINTS } from './config';

describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getApiUrl', () => {
    it('should return the default API URL when environment variable is not set', () => {
      delete process.env.REACT_APP_API_URL;
      expect(getApiUrl()).toBe('/api');
    });

    it('should return the environment variable value when set', () => {
      process.env.REACT_APP_API_URL = 'https://custom-api.example.com';
      // Re-import the module to get the updated value based on env
      jest.isolateModules(() => {
        const { getApiUrl } = require('./config');
        expect(getApiUrl()).toBe('https://custom-api.example.com');
      });
    });
  });

  describe('API_ENDPOINTS', () => {
    it('should have the correct SERVICE endpoint', () => {
      expect(API_ENDPOINTS.SERVICE).toBe('/service');
    });
  });
});
