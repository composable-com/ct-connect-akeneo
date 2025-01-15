import { Request, Response } from 'express';
import { post } from './job.controller';
import { createJobProcessor, customObjectStorage } from 'common-connect';
import CustomError from '../errors/custom.error';

jest.mock('common-connect', () => ({
  createJobProcessor: jest.fn(),
  customObjectStorage: {},
}));

describe('Job Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('post', () => {
    it('should create a job processor and return 200', async () => {
      (createJobProcessor as jest.Mock).mockResolvedValue(undefined);

      await post(mockRequest as Request, mockResponse as Response);

      expect(createJobProcessor).toHaveBeenCalledWith(
        'delta',
        customObjectStorage
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should throw CustomError when job processor creation fails', async () => {
      (createJobProcessor as jest.Mock).mockRejectedValue(
        new Error('Failed to create job')
      );

      await expect(
        post(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(CustomError);

      expect(createJobProcessor).toHaveBeenCalledWith(
        'delta',
        customObjectStorage
      );
    });
  });
});
