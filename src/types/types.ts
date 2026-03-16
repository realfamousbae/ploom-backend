import { InvalidPortError, MissingPropertyError } from './errors.ts';

import { join } from 'path';
import { cwd } from 'process';

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

export type ResponseCode = typeof Code[keyof typeof Code];

export interface Dictionary {
  [key: string]: any;
}

export const allowedFileExtensions = ['jpeg', 'jpg', 'png'];

/**
 * Equivalent of 50 megabytes in bytes.
 */
export const maxUploadingFileSize = 52_428_800;

export const apiPaths = [
  '/api/v1/authorize-user',
  '/api/v1/generate-from-single', 
  '/api/v1/generate-from-multiple',
  '/api/v1/register-new-user',
  '/api/v1/profile'
];

/**
 * May be this is sh*t? :)))
 * @param filepath Path of file.
 * @returns `string` joined file path with `cwd()`.
 */
export const joinWithCwd = (...parts: string[]) => join(cwd(), ...parts);

export function checkPort(value: number): number | never {
  if (value.toString().length !== 4) {
    throw new InvalidPortError('Server port value must be in range between 1000 and 9999.');
  }

  return value;
}

/**
 * It is assumed that the file name is correct and ends with an `.extension`.
 * @param filename `string` file name.
 * @returns `string` file extension without a dot (`.`).
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts[parts.length - 1];
}

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
 * @param object -
 * @param propertyNames -
 * @returns -
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

// May this be a dataclass??
export class UploadedImage {
  public readonly fileName: string;
  public readonly fileExtension: string;

  public constructor(fileName: string) {
    this.fileName = fileName;
    this.fileExtension = getFileExtension(this.fileName);
  }
}
