import CustomError from './custom.error';

describe('CustomError', () => {
  it('should create an error with statusCode and message', () => {
    const statusCode = 400;
    const message = 'Bad Request';
    const error = new CustomError(statusCode, message);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(CustomError);
    expect(error.statusCode).toBe(statusCode);
    expect(error.message).toBe(message);
    expect(error.errors).toBeUndefined();
  });

  it('should create an error with string statusCode', () => {
    const statusCode = 'INVALID_INPUT';
    const message = 'Invalid input provided';
    const error = new CustomError(statusCode, message);

    expect(error.statusCode).toBe(statusCode);
    expect(error.message).toBe(message);
  });

  it('should create an error with additional errors array', () => {
    const statusCode = 422;
    const message = 'Validation Error';
    const errors = [
      {
        statusCode: 422,
        message: 'Field is required',
        referencedBy: 'name'
      },
      {
        statusCode: 422,
        message: 'Invalid email format',
        referencedBy: 'email'
      }
    ];

    const error = new CustomError(statusCode, message, errors);

    expect(error.statusCode).toBe(statusCode);
    expect(error.message).toBe(message);
    expect(error.errors).toEqual(errors);
    expect(error.errors?.length).toBe(2);
  });
}); 