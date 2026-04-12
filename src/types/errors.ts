import { MulterError } from 'multer';

import type { NextFunction, Request, Response, } from 'express';

import { Code } from './types.ts';

import { argv } from 'process';

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

export class MissingPropertyError extends Error {
  public constructor(message: string) {
    super(message);
  }
}

/**
 * Checks if logging is enabled by looking for the `-l` flag in the command-line arguments.
 * This allows developers to easily enable or disable logging without changing the code.
 * @returns `true` if logging is enabled, `false` otherwise.
 */
export function isLoggingEnabled(): boolean {
  return "-l" in argv;
}

/**
 * Logs each incoming request (method + path + client IP).
 * This helps to visibly trace incoming traffic during development.
 * 
 * @param request - The incoming request to log.
 * @param _response - The response object, not used in this middleware but required by the signature.
 * @param next - Function to continue to the next middleware or route handler.
 */
export function logIncomingRequest(request: Request, _response: Response, next: NextFunction): void {
  console.log(
    `[${new Date().toISOString()}] ${request.method} ${request.originalUrl} from ${request.ip}`
  );

  next();
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
