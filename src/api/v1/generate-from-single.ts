import type { Request, Response } from 'express';

import { ApiDatabase } from '../../models/database.ts';
import { Code, joinWithCwd, maxUploadingFileSize } from '../../types/types.ts';
import { getConfig } from '../../config.ts';
import { requestAIGeneration } from '../ai.ts';

import { readFileSync } from 'fs';

export async function generateFromSingleImage(
  request: Request, 
  response: Response, 
  db: ApiDatabase
): Promise<any> {
  response.status(Code.BadRequest);

  const userIdParam = request.query['user_id'] as string;

  if (!userIdParam) {
    return response.json({
      message: 'To generate an image, you must pass a unique user ID as the user-id request parameter.'
    });
  }
  if (!request.file) {
    return response.json({ message: 'No file uploaded.' });
  }
  if (request.file.size > maxUploadingFileSize) {
    return response.json({ message: 'The size of the uploaded file must not exceed 50 megabytes.' });
  }

  const userId = Number.parseInt(userIdParam);
  if (Number.isNaN(userId)) {
    return response.json({ message: 'user_id parameter must be a numeric value.' });
  }

  try {
    const config = getConfig();
    const imageData = readFileSync(request.file.path);

    const generatedImageUrl = await requestAIGeneration(
      config,
      imageData,
      request.file.originalname,
      request.file.mimetype
    );
    
    db.insertGeneration({ 
      user_id: userId, 
      uploaded_images_paths: [joinWithCwd(request.file.path)],
      generated_image_path: generatedImageUrl
    });

    response.status(Code.OK)
      .json({
        message: 'Image generated successfully.',
        generated_image_url: generatedImageUrl
      });
  } catch (error: any) {
    console.error('AI Generation Error:', error);
    response.status(Code.InternalServerError).json({
      message: 'An error occurred during image generation.',
      error: error.message
    });
  }
}
