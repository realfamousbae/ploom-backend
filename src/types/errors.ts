/**
 * @module src/types/errors
 * 
 * @description Custom error classes for specific error scenarios in the application.
 * These classes extend the built-in `Error` class and provide a consistent way to 
 * handle and identify different types of errors throughout the codebase.
 * 
 * Each class has a constructor that accepts a message string, which is passed to the base `Error` class.
 * This allows for clear and descriptive error messages when these errors are thrown and caught in the application.
 * 
 * Additionally, this file includes utility functions for logging incoming requests and handling errors from 
 * middleware, specifically for handling errors from the Multer file upload middleware.
 * 
 * The `isLoggingEnabled` function checks for the presence of a `-l` flag in the command-line arguments to
 * determine if logging should be enabled, while the `logIncomingRequest` function logs details of each incoming 
 * request to the console, including the method, URL, and client IP address.
 * 
 * The `handleMiddlewareErrors` function is designed to catch errors thrown by middleware, particularly those 
 * from Multer, and respond with an appropriate error message and status code. If the error is not a Multer error, 
 * it passes the error to the next error-handling middleware in the Express application.
 * 
 * Overall, this file provides a structured way to manage errors and logging in the application, improving 
 * maintainability and debugging capabilities.
 */

import { MulterError } from 'multer';

import type { NextFunction, Request, Response, } from 'express';

import { Code } from './types.ts';
import { getLogger } from '../utils/logger.ts';

const httpLogger = getLogger('http');
const middlewareLogger = getLogger('middleware');

/**
 * Custom error class for invalid port numbers. This error is thrown 
 * when a provided port number is not valid (e.g., not a number, out of range).
 */
export class InvalidPortError extends Error {
  public constructor(message: string) {
    super(message);
  }
}

/**
 * Custom error class for invalid file extensions. This error is thrown when a 
 * file with an unsupported extension is uploaded or processed.
 */
export class InvalidFileExtensionError extends Error {
  public constructor(message: string) {
    super(message);
  }
}

/**
 * Custom error class for empty configuration files. This error is thrown 
 * when a configuration file is found but is empty.
 */
export class EmptyConfigFileError extends Error {
  public constructor(message: string) {
    super(message);
  }
}

/**
 * Custom error class for missing properties. This error is thrown 
 * when a required property is not provided.
 */
export class MissingPropertyError extends Error {
  public constructor(message: string) {
    super(message);
  }
}

/**
 * Express middleware that logs the start and finish of every incoming request.
 *
 * On entry it emits an `info` line with the HTTP method, URL, client IP and user agent.
 * On `finish` it emits a follow-up line with the status code and duration in milliseconds.
 * Query parameters are logged at `debug` level so they are visible only when
 * `LOG_LEVEL=debug` is set.
 *
 * @param request - The incoming request to log.
 * @param response - The response object; used to hook the `finish` event for timing.
 * @param next - Function to continue to the next middleware or route handler.
 */
export function logIncomingRequest(request: Request, response: Response, next: NextFunction): void {
  const start = Date.now();

  httpLogger.info(`-> ${request.method} ${request.originalUrl}`, {
    ip: request.ip,
    userAgent: request.headers['user-agent'],
  });

  if (request.query && Object.keys(request.query).length > 0) {
    httpLogger.debug('request query', { query: request.query });
  }

  response.on('finish', () => {
    const durationMs = Date.now() - start;
    const meta = {
      status: response.statusCode,
      durationMs,
    };
    if (response.statusCode >= 500) {
      httpLogger.error(`<- ${request.method} ${request.originalUrl}`, meta);
    } else if (response.statusCode >= 400) {
      httpLogger.warn(`<- ${request.method} ${request.originalUrl}`, meta);
    } else {
      httpLogger.info(`<- ${request.method} ${request.originalUrl}`, meta);
    }
  });

  next();
}

/**
 * Middleware to handle errors from Multer (file upload middleware). If an error is an instance 
 * of `MulterError`, it sends a 400 Bad Request response with the error message. For other 
 * types of errors, it passes the error to the next error-handling middleware.
 * 
 * @param error - The error object that was thrown.
 * @param _request - The incoming request, not used in this middleware but required 
 * by the signature.
 * @param response - The response object used to send the error response if 
 * it's a Multer error.
 * @param next - Function to continue to the next middleware or route handler if the 
 * error is not a Multer error.
 * 
 * @returns A JSON response with the error message if it's a Multer error, or passes the error to the next middleware otherwise.
 */
export function handleMiddlewareErrors(
  error: Error, 
  _request: Request, 
  response: Response, 
  next: NextFunction
): any {
  if (error instanceof MulterError) {
    middlewareLogger.warn('multer error', {
      code: error.code,
      field: error.field,
      message: error.message,
    });
    return response.status(Code.BadRequest)
      .json({ message: `Multer error: ${error.message}` });
  }

  middlewareLogger.error('unhandled middleware error', { error });
  next(error);
}
