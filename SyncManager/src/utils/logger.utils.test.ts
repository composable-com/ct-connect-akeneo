import { logger } from './logger.utils';

describe('logger', () => {
  it('should be defined', () => {
    expect(logger).toBeDefined();
  });

  it('should have a log method', () => {
    expect(typeof logger.log).toBe('function');
  });

  it('should have an error method', () => {
    expect(typeof logger.error).toBe('function');
  });

  it('should have a warn method', () => {
    expect(typeof logger.warn).toBe('function');
  });

  it('should have an info method', () => {
    expect(typeof logger.info).toBe('function');
  });
});
