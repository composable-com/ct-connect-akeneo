import { Request, Response, NextFunction } from 'express';
import { errorMiddleware } from './error.middleware';
import CustomError from '../errors/custom.error';

type ErrorItem = {
  statusCode: number | string;
  message: string;
  referencedBy?: string;
};

describe('Error Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  it('should handle CustomError with correct status code and message in development mode', () => {
    process.env.NODE_ENV = 'development';
    const customError = new CustomError(400, 'Custom error message');
    const errors: ErrorItem[] = [
      { statusCode: 400, message: 'error1' },
      { statusCode: 400, message: 'error2' },
    ];
    customError.errors = errors;

    errorMiddleware(
      customError,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Custom error message',
      errors,
      stack: expect.any(String),
    });
  });

  it('should handle CustomError without stack trace in production mode', () => {
    process.env.NODE_ENV = 'production';
    const customError = new CustomError(400, 'Custom error message');
    const errors: ErrorItem[] = [{ statusCode: 400, message: 'error1' }];
    customError.errors = errors;

    errorMiddleware(
      customError,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Custom error message',
      errors,
      stack: undefined,
    });
  });

  it('should handle regular Error with details in development mode', () => {
    process.env.NODE_ENV = 'development';
    const error = new Error('Regular error');

    errorMiddleware(
      error,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.send).toHaveBeenCalledWith({
      messge: 'Regular error',
    });
  });

  it('should handle regular Error with generic message in production mode', () => {
    process.env.NODE_ENV = 'production';
    const error = new Error('Regular error');

    errorMiddleware(
      error,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.send).toHaveBeenCalledWith({
      message: 'Internal server error',
    });
  });
});
