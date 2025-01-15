jest.mock('common-connect', () => ({
  customObjectStorage: {
    test1: {
      container: 'test-container-1',
      key: 'test-key-1',
    },
    test2: {
      container: 'test-container-2',
      key: 'test-key-2',
    },
  },
  deleteCustomObject: jest.fn(),
  fetchCustomObject: jest.fn(),
  syncManager: {
    container: 'sync-manager',
    key: 'sync-key',
  },
}));

import {
  updateCustomObject,
  syncManager,
  fetchCustomObject,
  deleteCustomObject,
} from 'common-connect';
import { run } from './pre-undeploy';
import { mocked } from 'jest-mock';

describe('run', () => {
  const mockedFetchCustomObject = mocked(fetchCustomObject, {
    shallow: true,
  });
  const mockedDeleteCustomObject = mocked(deleteCustomObject, {
    shallow: true,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.exitCode = 0;
  });
  it('should delete all custom objects with values and sync manager', async () => {
    mockedFetchCustomObject.mockResolvedValue({
      id: '123',
      version: 1,
      createdAt: new Date().toISOString(),
      lastModifiedAt: new Date().toISOString(),
      container: 'test-container',
      key: 'test-key',
      value: 'some-value',
    });

    await run();

    // Verify custom objects deletion
    expect(mockedFetchCustomObject).toHaveBeenCalledTimes(2);
    expect(mockedFetchCustomObject).toHaveBeenCalledWith({
      container: 'test-container-1',
      key: 'test-key-1',
    });
    expect(mockedFetchCustomObject).toHaveBeenCalledWith({
      container: 'test-container-2',
      key: 'test-key-2',
    });

    expect(mockedDeleteCustomObject).toHaveBeenCalledTimes(3);
    expect(mockedDeleteCustomObject).toHaveBeenCalledWith({
      container: 'test-container-1',
      key: 'test-key-1',
    });
    expect(mockedDeleteCustomObject).toHaveBeenCalledWith({
      container: 'test-container-2',
      key: 'test-key-2',
    });
    expect(mockedDeleteCustomObject).toHaveBeenCalledWith(syncManager);
    expect(process.exitCode).toBe(0);
  });

  it('should not delete custom objects without values but still delete sync manager', async () => {
    mockedFetchCustomObject.mockResolvedValue({
      value: null,
    });

    await run();

    expect(mockedFetchCustomObject).toHaveBeenCalledTimes(2);
    expect(mockedDeleteCustomObject).toHaveBeenCalledTimes(1);
    expect(mockedDeleteCustomObject).toHaveBeenCalledWith(syncManager);
    expect(process.exitCode).toBe(0);
  });

  it('should set exitCode to 1 when an error occurs', async () => {
    mockedFetchCustomObject.mockRejectedValue(new Error('Test error'));

    await run();

    expect(process.exitCode).toBe(1);
  });
});
