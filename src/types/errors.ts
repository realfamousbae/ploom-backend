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

import { argv } from 'process';

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
 * Checks if logging is enabled by looking for the `-l` flag in the command-line arguments.
 * This allows developers to easily enable or disable logging without changing the code.
 * 
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
    return response.status(Code.BadRequest)
      .json({ message: `Multer error: ${error.message}` });
  }

  next(error);
}
