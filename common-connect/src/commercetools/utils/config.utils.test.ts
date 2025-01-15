import CustomError from '../errors/custom.error';
import { readConfiguration } from './config.utils';

describe('readConfiguration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should read valid configuration successfully', () => {
    // Arrange
    process.env.CTP_CLIENT_ID = 'a'.repeat(24);
    process.env.CTP_CLIENT_SECRET = 'b'.repeat(32);
    process.env.CTP_PROJECT_KEY = 'valid-project-key';
    process.env.CTP_REGION = 'us-central1.gcp';

    // Act
    const config = readConfiguration();

    // Assert
    expect(config).toEqual({
      clientId: 'a'.repeat(24),
      clientSecret: 'b'.repeat(32),
      projectKey: 'valid-project-key',
      scope: undefined,
      region: 'us-central1.gcp',
    });
  });

  it('should read valid configuration with optional scope', () => {
    // Arrange
    process.env.CTP_CLIENT_ID = 'a'.repeat(24);
    process.env.CTP_CLIENT_SECRET = 'b'.repeat(32);
    process.env.CTP_PROJECT_KEY = 'valid-project-key';
    process.env.CTP_SCOPE = 'manage_project';
    process.env.CTP_REGION = 'us-central1.gcp';

    // Act
    const config = readConfiguration();

    // Assert
    expect(config).toEqual({
      clientId: 'a'.repeat(24),
      clientSecret: 'b'.repeat(32),
      projectKey: 'valid-project-key',
      scope: 'manage_project',
      region: 'us-central1.gcp',
    });
  });

  it('should throw error for invalid client ID length', () => {
    // Arrange
    process.env.CTP_CLIENT_ID = 'invalid';
    process.env.CTP_CLIENT_SECRET = 'b'.repeat(32);
    process.env.CTP_PROJECT_KEY = 'valid-project-key';
    process.env.CTP_REGION = 'us-central1.gcp';

    // Act & Assert
    expect(() => readConfiguration()).toThrow(CustomError);
    expect(() => readConfiguration()).toThrow('Invalid Environment Variables please check your .env file');
  });

  it('should throw error for invalid client secret length', () => {
    // Arrange
    process.env.CTP_CLIENT_ID = 'a'.repeat(24);
    process.env.CTP_CLIENT_SECRET = 'invalid';
    process.env.CTP_PROJECT_KEY = 'valid-project-key';
    process.env.CTP_REGION = 'us-central1.gcp';

    // Act & Assert
    expect(() => readConfiguration()).toThrow(CustomError);
    expect(() => readConfiguration()).toThrow('Invalid Environment Variables please check your .env file');
  });

  it('should throw error for missing required environment variables', () => {
    // Arrange
    process.env.CTP_CLIENT_ID = 'a'.repeat(24);
    // Missing CTP_CLIENT_SECRET
    process.env.CTP_PROJECT_KEY = 'valid-project-key';
    process.env.CTP_REGION = 'us-central1.gcp';

    // Act & Assert
    expect(() => readConfiguration()).toThrow(CustomError);
    expect(() => readConfiguration()).toThrow('Invalid Environment Variables please check your .env file');
  });

  it('should throw error for invalid region', () => {
    // Arrange
    process.env.CTP_CLIENT_ID = 'a'.repeat(24);
    process.env.CTP_CLIENT_SECRET = 'b'.repeat(32);
    process.env.CTP_PROJECT_KEY = 'valid-project-key';
    process.env.CTP_REGION = 'invalid-region';

    // Act & Assert
    expect(() => readConfiguration()).toThrow(CustomError);
    expect(() => readConfiguration()).toThrow('Invalid Environment Variables please check your .env file');
  });
}); 