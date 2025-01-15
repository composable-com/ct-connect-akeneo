jest.mock('common-connect', () => ({
  updateCustomObject: jest.fn().mockResolvedValue(undefined),
  syncManager: {
    container: 'test-container',
    key: 'test-key',
  },
}));

import { run } from './post-deploy';
import { updateCustomObject, syncManager } from 'common-connect';
import { mocked } from 'jest-mock';

describe('run', () => {
  const mockedUpdateCustomObject = mocked(updateCustomObject, {
    shallow: true,
  });

  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.exitCode;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should update custom object with service url when CONNECT_SERVICE_URL is set', async () => {
    process.env.CONNECT_SERVICE_URL = 'https://test-service-url';

    await run();

    expect(mockedUpdateCustomObject).toHaveBeenCalledWith({
      ...syncManager,
      value: JSON.stringify({
        url: 'https://test-service-url',
        config: '',
      }),
    });
    expect(process.exitCode).toBeUndefined();
  });

  it('should update custom object with empty url when CONNECT_SERVICE_URL is not set', async () => {
    delete process.env.CONNECT_SERVICE_URL;

    await run();

    expect(mockedUpdateCustomObject).toHaveBeenCalledWith({
      ...syncManager,
      value: JSON.stringify({
        url: '',
        config: '',
      }),
    });
    expect(process.exitCode).toBeUndefined();
  });

  it('should set exit code to 1 when an error occurs', async () => {
    mockedUpdateCustomObject.mockRejectedValueOnce(new Error('Test error'));

    await run();

    expect(mockedUpdateCustomObject).toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });
});
