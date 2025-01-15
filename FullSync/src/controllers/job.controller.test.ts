import { Request, Response } from 'express';
import CustomError from '../errors/custom.error';
import { post } from './job.controller';
import { createJobProcessor, customObjectStorage } from 'common-connect';

jest.mock('common-connect', () => ({
  createJobProcessor: jest.fn(),
  customObjectStorage: {},
}));

describe('POST handler', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    (createJobProcessor as jest.Mock).mockReset();
  });

  it('should call createJobProcessor with correct arguments and return 200 on success', async () => {
    // Arrange
    (createJobProcessor as jest.Mock).mockResolvedValue(undefined);

    // Act
    await post(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(createJobProcessor).toHaveBeenCalledTimes(1);
    expect(createJobProcessor).toHaveBeenCalledWith(
      'full',
      customObjectStorage
    );
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.send).toHaveBeenCalled();
  });

  it('should throw CustomError with status 500 when createJobProcessor fails', async () => {
    // Arrange
    const testError = new Error('Some processing error');
    (createJobProcessor as jest.Mock).mockRejectedValue(testError);

    try {
      // Act
      await post(mockRequest as Request, mockResponse as Response);
      fail('Expected post handler to throw');
    } catch (error) {
      // Assert
      expect(createJobProcessor).toHaveBeenCalledTimes(1);
      expect(error).toBeInstanceOf(CustomError);
      expect((error as CustomError).statusCode).toBe(500);
      expect((error as CustomError).message).toBe(
        'Internal Server Error - Error processing full sync job'
      );
    }
  });

  it('should not send a response if an error is thrown', async () => {
    // Arrange
    (createJobProcessor as jest.Mock).mockRejectedValue(new Error('Failure'));

    try {
      // Act
      await post(mockRequest as Request, mockResponse as Response);
    } catch (_) {
      // Assert
      // Ensure no status or send was called due to the thrown error
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.send).not.toHaveBeenCalled();
    }
  });
});
