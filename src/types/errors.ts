import { MulterError } from 'multer';

import type { NextFunction, Request, Response, } from 'express';

import { Code } from './types.ts';

export class InvalidPortError extends Error {
  public constructor(message: string) {
    super(message);
  }
}

export class InvalidFileExtensionError extends Error {
  public constructor(message: string) {
    super(message);
  }
}

export class EmptyConfigFileError extends Error {
  public constructor(message: string) {
    super(message);
  }
}

/**
 * Function for handling and identifying errors and exceptions thrown by the `Multer` module.
 * 
 * @param error Multer's thrown error.
 * @param _request the request on which the error occurred.
 * @param response the reponse on which the error occurred.
 * @param next Function continuing execution.
 * @returns `any`, but actually `Response<any, Record<string, any>>`, 
 * because this will never been used. 
 */
export function handleMiddlewareErrors(
  error: Error, 
  _request: Request, 
  response: Response, 
  next: NextFunction
): any {
  if (error instanceof MulterError) {
    return response.status(Code.BadRequest)
      .json({ message: `Multer error: ${error.message}` });
  }

  next(error);
}
