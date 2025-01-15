import { createHttpMiddlewareOptions } from './http.middleware';

describe('HTTP Middleware', () => {
  describe('createHttpMiddlewareOptions', () => {
    it('should create middleware options with correct host based on region', () => {
      const region = 'us-east-1';
      const options = createHttpMiddlewareOptions(region);

      expect(options.host).toBe(`https://api.${region}.commercetools.com`);
    });

    it('should include fetch as the httpClient', () => {
      const region = 'eu-west-1';
      const options = createHttpMiddlewareOptions(region);

      expect(options.httpClient).toBe(fetch);
    });

    it('should work with different regions', () => {
      const regions = ['us-east-1', 'eu-west-1', 'asia-pacific'];
      
      regions.forEach(region => {
        const options = createHttpMiddlewareOptions(region);
        expect(options.host).toBe(`https://api.${region}.commercetools.com`);
        expect(options.httpClient).toBe(fetch);
      });
    });
  });
}); 