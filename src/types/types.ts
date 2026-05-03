/**
 * @module src/types/types
 * 
 * @description This module defines various types, constants, and utility functions that are used 
 * throughout the project. It includes definitions for HTTP status codes, a dictionary type, 
 * allowed file extensions for image uploads, API paths, and functions for checking port values, 
 * extracting file extensions, stringifying values with specific rules, and getting typed parameters 
 * from objects. Additionally, it defines a class representing an uploaded image with its file 
 * name and extension.
 */

import { InvalidPortError, MissingPropertyError } from './errors.ts';

import { join } from 'path';
import { cwd } from 'process';

/**
 * Current working directory of the Node.js process. It is used as a base path for 
 * joining with other paths in the project, such as file paths for uploaded images or generated images.
 * 
 * The `cwd()` function from the `process` module returns the current working directory as a string. 
 * This value is stored in the `currentCwd` constant for later use in the project.
 */
const currentCwd = cwd();

/**
 * Object containing predefined HTTP status codes that can be used in API responses.
 * Each property of the `Code` object represents a specific HTTP status code, such as 
 * `OK`, `Created`, `BadRequest`, etc.
 * 
 * The values of these properties are the corresponding numeric HTTP status codes, 
 * which can be used to indicate the result of an API request.
 */
export const Code = {
  OK: 200,
  Created: 201,
  BadRequest: 400,
  Unauthorized: 401,
  Forbidden: 403,
  NotFound: 404,
  Conflict: 409,
  InternalServerError: 500
} as const;

/**
 * Type representing the possible response codes that can be returned by the API. 
 * It is derived from the `Code` object, which contains a set of predefined HTTP status codes. 
 * The `ResponseCode` type is a union of the values of the `Code` object, allowing only 
 * valid HTTP status codes to be used in the API responses.
 */
export type ResponseCode = typeof Code[keyof typeof Code];

/**
 * A simple dictionary type that allows any string keys with values of any type. 
 * This type is used to represent objects that can have dynamic properties, where the 
 * property names are not known in advance.
 */
export interface Dictionary {
  [key: string]: any;
}

/**
 * Array of allowed file extensions for uploading images. It is assumed that the file extension 
 * is in lowercase and does not contain a dot (`.`).
 */
export const allowedFileExtensions = ['jpeg', 'jpg', 'png'];

/**
 * Equivalent of 50 megabytes in bytes.
 */
export const maxUploadingFileSize = 52_428_800;

/**
 * Array of API paths that are used in the project. It is assumed that all API paths start with `/api/v1/`.
 */
export const apiPaths = [
  '/api/v1/authorize-user',
  '/api/v1/generate-from-single', 
  '/api/v1/generate-from-multiple',
  '/api/v1/profile',
  '/api/v1/register-new-user'
];

/**
 * Joins the provided path parts with the current working directory.
 * 
 * @param parts - `string[]` array of path parts to join.
 * 
 * @returns `string` joined file path with `cwd()`.
 */
export const joinWithCwd = (...parts: string[]) => join(currentCwd, ...parts);

export function checkPort(value: number): number | never {
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new InvalidPortError('Server port value must be an integer in range between 1 and 65535.');
  }

  return value;
}

/**
 * It is assumed that the file name is correct and ends with a dot (`.`) followed by the file extension.
 * 
 * @param filename `string` file name.
 * 
 * @returns `string` file extension without a dot (`.`).
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts[parts.length - 1];
}

/**
 * Converts a value to a string, applying specific rules for different types.
 * 
 * @param value The value to convert.
 * 
 * @returns The string representation of the value.
 */
export function stringifyWithRules(value: any): string {
  if (value instanceof Array) {
    value = JSON.stringify(value);
  }

  if (typeof value === 'string') {
    return `'${value}'`;
  }

  return `${value}`;
}

/**
 * If one of the parameters is missing, it is necessary to 
 * return a corresponding message about this.
 * @param object - `object` from which the properties will be taken.
 * @param propertyNames - `string[]` array of required property names.
 * 
 * @returns `T` object with required properties.
 * @throws {MissingPropertyError} If one of the required properties is missing.
 */
export function getTypedParamsAs<T extends Dictionary>(
  object: any, ...propertyNames: string[]
): T {
  let properties: Dictionary = {};

  for (const propertyName of propertyNames) {
    const property = object[propertyName];

    if (property === undefined) {
      throw new MissingPropertyError(`Required property '${propertyName}' is missing.`);
    }

    properties[propertyName] = property;
  }

  return properties as T;
}

/**
 * Class representing an uploaded image, containing the file name and file extension.
 * The file extension is derived from the file name using the `getFileExtension` function.
 */
export class UploadedImage {
  /**
   * The name of the uploaded file, including the file extension. It is assumed that 
   * the file name is correct and ends with a dot (`.`) followed by the file extension.
   * The file extension is derived from the file name using the `getFileExtension` 
   * function and is stored in the `fileExtension` property.
   */
  public readonly fileName: string;
  /**
   * The file extension of the uploaded file, derived from the `fileName` property using 
   * the `getFileExtension` function. It is assumed that the file extension is in lowercase 
   * and does not contain a dot (`.`). 
   * 
   * For example, if the `fileName` is `image.jpeg`, the `fileExtension` will be `jpeg`.
   */
  public readonly fileExtension: string;

  public constructor(fileName: string) {
    this.fileName = fileName;
    this.fileExtension = getFileExtension(this.fileName);
  }
}
