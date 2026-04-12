import type { Request, Response } from 'express';

import { ApiDatabase } from '../../models/database.ts';
import { Code, joinWithCwd, maxUploadingFileSize } from '../../types/types.ts';
import { getConfig } from '../../config.ts';
import { requestMultiImageAIGeneration } from '../ai.ts';

import { readFileSync } from 'fs';

export async function generateFromMultipleImages(
  request: Request, 
  response: Response,
  db: ApiDatabase
): Promise<any> {
  const userIdParam = request.query['user_id'] as string;
  const files = request.files as Express.Multer.File[];

  response.status(Code.BadRequest);
  
  if (!userIdParam) {
    return response.json({ 
      message: 'To generate an image, you must pass a unique user ID as the user-id request parameter.'
    });
  }
  if (!request.files || files.length === 0) {
    return response.status(Code.BadRequest)
      .json({ message: 'No files uploaded' });
  }

  const userId = Number.parseInt(userIdParam);
  if (Number.isNaN(userId)) {
    return response.json({ message: 'user_id parameter must be a numeric value.' });
  }

  for (const file of files) {
    if (file.size > maxUploadingFileSize) {
      return response.status(Code.BadRequest)
        .json({ message: 'The size of each uploaded file must not exceed 50 megabytes.' });
    }
  }

  try {
    const config = getConfig();
    const imagesInput = files.map(file => ({
      data: readFileSync(file.path),
      name: file.originalname,
      mimeType: file.mimetype
    }));

    const generatedImageUrl = await requestMultiImageAIGeneration(
      config,
      imagesInput
    );
    
    const filesPaths = files.map(file => joinWithCwd(file.path));
    
    db.insertGeneration({ 
      user_id: userId, 
      uploaded_images_paths: filesPaths,
      generated_image_path: generatedImageUrl
    });

    response.status(Code.OK)
      .json({
        message: 'Images generated successfully.',
        generated_image_url: generatedImageUrl
      });
  } catch (error: any) {
    console.error('AI Multi-Image Generation Error:', error);
    response.status(Code.InternalServerError).json({
      message: 'An error occurred during multi-image generation.',
      error: error.message
    });
  }
}
