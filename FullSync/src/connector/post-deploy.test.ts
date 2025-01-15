import { run } from './post-deploy';
import {
  updateCustomObject,
  customObjectStorage,
  JobStatus,
  fetchCustomObject,
} from 'common-connect';

jest.mock('common-connect', () => ({
  updateCustomObject: jest.fn(),
  customObjectStorage: {
    full: {
      container: 'test-container',
      key: 'test-key',
    },
  },
  JobStatus: {
    IDLE: 'idle',
  },
  fetchCustomObject: jest.fn(),
}));

describe('run', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.exitCode = 0;
  });

  it('should update custom object if value is not present', async () => {
    (fetchCustomObject as jest.Mock).mockResolvedValue({ value: null });

    await run();

    expect(fetchCustomObject).toHaveBeenCalledWith({
      container: 'test-container',
      key: 'test-key',
    });
    expect(updateCustomObject).toHaveBeenCalledWith({
      container: 'test-container',
      key: 'test-key',
      value: JSON.stringify({
        status: JobStatus.IDLE,
      }),
    });
    expect(process.exitCode).toBe(0);
  });

  it('should not update custom object if value is present', async () => {
    (fetchCustomObject as jest.Mock).mockResolvedValue({ value: 'some-value' });

    await run();

    expect(fetchCustomObject).toHaveBeenCalledWith({
      container: 'test-container',
      key: 'test-key',
    });
    expect(updateCustomObject).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(0);
  });

  it('should set process.exitCode to 1 if an error occurs', async () => {
    (fetchCustomObject as jest.Mock).mockRejectedValue(new Error('test error'));

    await run();

    expect(fetchCustomObject).toHaveBeenCalledWith({
      container: 'test-container',
      key: 'test-key',
    });
    expect(updateCustomObject).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });
});
