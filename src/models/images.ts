/**
 * @module src/models/images
 * 
 * @description This module defines a function to create a Multer storage engine for handling image 
 * uploads in an Express application. The storage engine is configured to store images in different 
 * directories based on the request path. If the request path is '/api/v1/register-new-user', 
 * images will be stored in the profile images directory. For all other paths, images will be 
 * stored in the uploaded images directory.
 */

import { diskStorage, type StorageEngine } from 'multer';

import type { Request } from 'express';

import { type Config } from '../config.ts';

/**
 * Returns a Multer storage engine configured to store images in different directories based on the request path.
 * If the request path is '/api/v1/register-new-user', images will be stored in the profile images directory.
 * For all other paths, images will be stored in the uploaded images directory.
 * 
 * @param config - The configuration object containing paths for profile and uploaded images.
 * @returns A Multer storage engine configured for image storage.
 */
export function getImageStorage(config: Config): StorageEngine {
  return diskStorage({
    destination: (
      request: Request,
      _file: Express.Multer.File,
      callback: (error: Error | null, destination: string) => void
    ) => {
      if (request.path === '/api/v1/register-new-user') {
        return callback(null, config.paths.profileImages);
      }

      callback(null, config.paths.uploadedImages);
    },
    filename: (
      _request: Request,
      file: Express.Multer.File,
      callback: (error: Error | null, filename: string) => void
    ) => {
      callback(
        null,
        Date.now() + '-' + file.originalname
      );
    }
  });
}
