import { run } from './pre-undeploy';
import {
  customObjectStorage,
  deleteCustomObject,
  fetchCustomObject,
} from 'common-connect';

jest.mock('common-connect', () => ({
  customObjectStorage: {
    full: {
      container: 'test-container',
      key: 'test-key',
    },
  },
  deleteCustomObject: jest.fn(),
  fetchCustomObject: jest.fn(),
}));

describe('run', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.exitCode;
  });

  it('should delete custom object if value exists', async () => {
    (fetchCustomObject as jest.Mock).mockResolvedValue({ value: 'some-value' });

    await run();

    expect(fetchCustomObject).toHaveBeenCalledWith({
      container: 'test-container',
      key: 'test-key',
    });
    expect(deleteCustomObject).toHaveBeenCalledWith({
      container: 'test-container',
      key: 'test-key',
    });
    expect(process.exitCode).toBeUndefined();
  });

  it('should not delete custom object if value does not exist', async () => {
    (fetchCustomObject as jest.Mock).mockResolvedValue({ value: null });

    await run();

    expect(fetchCustomObject).toHaveBeenCalledWith({
      container: 'test-container',
      key: 'test-key',
    });
    expect(deleteCustomObject).not.toHaveBeenCalled();
    expect(process.exitCode).toBeUndefined();
  });

  it('should set exit code to 1 when an error occurs', async () => {
    (fetchCustomObject as jest.Mock).mockRejectedValue(new Error('Test error'));

    await run();

    expect(fetchCustomObject).toHaveBeenCalledWith({
      container: 'test-container',
      key: 'test-key',
    });
    expect(deleteCustomObject).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });
});
