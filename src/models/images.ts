import { diskStorage, type StorageEngine } from 'multer';

import type { Request } from 'express';

import { type Config } from '../config.ts';

/**
 * Somehow auth and others checks should be added here...
 *
 * @returns `StorageEngine` - a special object for storing images.
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
      // FIXME: Here must be done normal file naming.
      callback(
        null,
        Date.now() + '-' + file.originalname
      );
    }
  });
}
