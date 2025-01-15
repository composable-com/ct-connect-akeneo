import { run } from './pre-undeploy';
import { deleteCustomObject, fetchCustomObject } from 'common-connect';

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
    process.exitCode = 0;
  });

  it('should delete the custom object if it exists', async () => {
    (fetchCustomObject as jest.Mock).mockResolvedValue({ value: true });

    await run();

    expect(fetchCustomObject).toHaveBeenCalledWith({
      container: 'test-container',
      key: 'test-key',
    });
    expect(deleteCustomObject).toHaveBeenCalledWith({
      container: 'test-container',
      key: 'test-key',
    });
    expect(process.exitCode).toBe(0);
  });

  it('should not delete the custom object if it does not exist', async () => {
    (fetchCustomObject as jest.Mock).mockResolvedValue({ value: false });

    await run();

    expect(fetchCustomObject).toHaveBeenCalledWith({
      container: 'test-container',
      key: 'test-key',
    });
    expect(deleteCustomObject).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(0);
  });

  it('should set process.exitCode to 1 if an error occurs', async () => {
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
