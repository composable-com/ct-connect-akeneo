import { run } from './post-deploy';
import {
  updateCustomObject,
  JobStatus,
  fetchCustomObject,
} from 'common-connect';

jest.mock('common-connect', () => ({
  updateCustomObject: jest.fn(),
  customObjectStorage: {
    delta: {
      container: 'test-container',
      key: 'test-key',
    },
  },
  JobStatus: {
    SCHEDULED: 'SCHEDULED',
  },
  fetchCustomObject: jest.fn(),
}));

describe('run', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
        status: JobStatus.SCHEDULED,
      }),
    });
  });

  it('should not update custom object if value is present', async () => {
    (fetchCustomObject as jest.Mock).mockResolvedValue({ value: 'some-value' });

    await run();

    expect(fetchCustomObject).toHaveBeenCalledWith({
      container: 'test-container',
      key: 'test-key',
    });
    expect(updateCustomObject).not.toHaveBeenCalled();
  });

  it('should set process.exitCode to 1 if an error occurs', async () => {
    (fetchCustomObject as jest.Mock).mockRejectedValue(new Error('test error'));

    await run();

    expect(process.exitCode).toBe(1);
  });
});
