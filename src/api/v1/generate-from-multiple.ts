/**
 * @module src/api/v1/generate-from-multiple
 * 
 * @description This module defines the `generateFromMultipleImages` function, which is responsible for handling
 * image generation requests based on multiple uploaded images. It validates the input, processes the images,
 * and interacts with the AI generation service to produce a new image. The generated image URL is then stored 
 * in the database along with the paths of the uploaded images.
 * 
 * The function expects a user ID as a query parameter and an array of uploaded files in the request. It checks
 * for the presence of these parameters, validates the file sizes, and then calls the AI generation service. 
 * If the generation is successful, it responds with the generated image URL; otherwise, it returns an 
 * appropriate error message.
 * 
 * The function also includes error handling to catch any issues that may arise during the generation process, 
 * such as problems with the AI service or file processing.
 */

import type { Request, Response } from 'express';

import { ApiDatabase } from '../../models/database.ts';
import { Code, maxUploadingFileSize } from '../../types/types.ts';
import { getConfig } from '../../config.ts';
import { requestMultiImageAIGeneration } from '../ai.ts';

import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Generates an image based on multiple uploaded images.
 * 
 * This function handles the HTTP request for generating an image from multiple uploaded images. 
 * It validates the input, processes the images, and interacts with the AI generation service 
 * to produce a new image. The generated image URL is then stored in the database along with the 
 * paths of the uploaded images.
 * 
 * @param request - The HTTP request object containing the user ID and uploaded files.
 * @param response - The HTTP response object used to send the generation result back to the client.
 * @param db - An instance of the `ApiDatabase` class used to interact with the database for storing 
 * generation information.
 * 
 * @returns A JSON response indicating the result of the image generation attempt.
 */
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
      .json({ message: 'No files uploaded.' });
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
    
    const filesPaths = files.map(file => resolve(file.path));
    
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
