import { Request, Response } from 'express';
import {
  createJobHandler,
  customObjectStorage,
  fetchCustomObject,
  JobStatus,
  updateCustomObject,
} from 'common-connect';

// Create mock functions
const mockFetchCustomObject = jest.fn();
const mockUpdateCustomObject = jest.fn();
const mockCreateJobHandler = jest.fn();

jest.mock('common-connect', () => ({
  createJobHandler: (...args: any[]) => mockCreateJobHandler(...args),
  customObjectStorage: {
    delta: { container: 'delta-container', key: 'delta-key' },
    full: { container: 'full-container', key: 'full-key' },
    all: { container: 'all-container', key: 'all-key' },
  },
  fetchCustomObject: (...args: any[]) => mockFetchCustomObject(...args),
  updateCustomObject: (...args: any[]) => mockUpdateCustomObject(...args),
  JobStatus: {
    RUNNING: 'running',
    RESUMABLE: 'resumable',
    SCHEDULED: 'scheduled',
    STOPPED: 'stopped',
    IDLE: 'idle',
    TO_STOP: 'to-stop',
  },
}));

import { post } from './service.controller';

describe('Service Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      body: {},
    };
    mockResponse = {
      json: jest.fn(),
    };
  });

  describe('save action', () => {
    it('should save config to custom object', async () => {
      const mockConfig = { key: 'value' };
      mockRequest.body = {
        action: 'save',
        syncType: 'delta',
        config: JSON.stringify(mockConfig),
      };

      mockFetchCustomObject.mockResolvedValueOnce({
        value: JSON.stringify({ existingKey: 'existingValue' }),
      });

      const result = await post(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockFetchCustomObject).toHaveBeenCalledWith({
        container: 'delta-container',
        key: 'delta-key',
      });

      expect(mockUpdateCustomObject).toHaveBeenCalledWith({
        container: 'delta-container',
        key: 'delta-key',
        value: JSON.stringify({
          existingKey: 'existingValue',
          config: mockConfig,
        }),
      });

      expect(result).toEqual({ status: 'success' });
    });
  });

  describe('start action', () => {
    const mockStartJobHandler = jest.fn();
    const mockCheckJobStatus = jest.fn();

    beforeEach(() => {
      mockCreateJobHandler.mockReturnValue({
        checkJobStatus: mockCheckJobStatus,
        startJobHandler: mockStartJobHandler,
      });
    });

    it('should not start if job is already running', async () => {
      mockRequest.body = {
        action: 'start',
        syncType: 'delta',
      };

      mockCheckJobStatus.mockResolvedValueOnce({ status: JobStatus.RUNNING });

      const result = await post(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(result).toEqual({ status: JobStatus.RUNNING });
      expect(mockStartJobHandler).not.toHaveBeenCalled();
    });

    it('should start job if status is IDLE', async () => {
      mockRequest.body = {
        action: 'start',
        syncType: 'delta',
      };

      mockCheckJobStatus.mockResolvedValueOnce({ status: JobStatus.IDLE });

      const result = await post(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStartJobHandler).toHaveBeenCalled();
      expect(result).toEqual({ status: JobStatus.SCHEDULED });
    });
  });

  describe('stop action', () => {
    const mockStopJobHandler = jest.fn();
    const mockCancelJobHandler = jest.fn();
    const mockCheckJobStatus = jest.fn();

    beforeEach(() => {
      mockCreateJobHandler.mockReturnValue({
        checkJobStatus: mockCheckJobStatus,
        stopJobHandler: mockStopJobHandler,
        cancelJobHandler: mockCancelJobHandler,
      });
    });

    it('should cancel job for full sync', async () => {
      mockRequest.body = {
        action: 'stop',
        syncType: 'full',
      };

      mockCheckJobStatus.mockResolvedValueOnce({ status: JobStatus.RUNNING });

      const result = await post(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockCancelJobHandler).toHaveBeenCalled();
      expect(result).toEqual({ status: JobStatus.STOPPED });
    });

    it('should stop job for delta sync', async () => {
      mockRequest.body = {
        action: 'stop',
        syncType: 'delta',
      };

      mockCheckJobStatus.mockResolvedValueOnce({ status: JobStatus.RUNNING });

      const result = await post(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStopJobHandler).toHaveBeenCalled();
      expect(result).toEqual({ status: JobStatus.TO_STOP });
    });
  });

  describe('get action', () => {
    const mockCheckJobStatus = jest.fn();

    beforeEach(() => {
      mockCreateJobHandler.mockReturnValue({
        checkJobStatus: mockCheckJobStatus,
      });
    });

    it('should return job status', async () => {
      mockRequest.body = {
        action: 'get',
        syncType: 'delta',
      };

      const mockStatus = {
        status: JobStatus.RUNNING,
        progress: 50,
      };

      mockCheckJobStatus.mockResolvedValueOnce(mockStatus);

      const result = await post(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(result).toEqual(mockStatus);
    });
  });
});
