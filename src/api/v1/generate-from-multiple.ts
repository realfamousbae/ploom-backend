import type { Request, Response } from 'express';

import { ApiDatabase } from '../../models/database.ts';
import { Code, joinWithCwd, maxUploadingFileSize } from '../../types/types.ts';

export function generateFromMultipleImages(
  request: Request, 
  response: Response,
  db: ApiDatabase
): any {
  const userIdParam = request.query['user_id'] as string;
  const files = request.files as Express.Multer.File[];

  response.status(Code.BadRequest);
  
  // FIXME: REMOVE INTO IMAGES STORAGE GENERATOR.
  if (!userIdParam) {
    return response.json({ 
      message: 'To generate an image, you must pass a unique user ID as the user-id request parameter.'
    });
  }
  if (!request.files || files.length === 0) {
    return response.status(Code.BadRequest)
      .json({ message: 'No files uploaded' });
  }

  for (const file of files) {
    if (file.size > maxUploadingFileSize) {
      return response.status(Code.BadRequest)
        .json({ message: 'The size of each uploaded file must not exceed 50 megabytes.' });
    }
  }

  try {
    // Generation here.
    
    const userId = Number.parseInt(userIdParam);
    const filesPaths = files.map(file => joinWithCwd(file.path));
    
    db.insertGeneration({ 
      user_id: userId, 
      uploaded_images_paths: filesPaths
    });

    response.status(Code.OK)
      .json({ message: 'Images uploaded successfully.' });
  } catch {
      return response.json({ message: 'user_id parameter must be a numeric value.' });
  }
}
