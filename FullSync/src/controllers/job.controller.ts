import { Request, Response } from 'express';
import CustomError from '../errors/custom.error';
import { createJobProcessor, customObjectStorage } from 'common-connect';

export const post = async (_request: Request, response: Response) => {
  try {
    await createJobProcessor('full', customObjectStorage);

    return response.status(200).send();
  } catch (error) {
    throw new CustomError(
      500,
      'Internal Server Error - Error processing full sync job'
    );
  }
};
