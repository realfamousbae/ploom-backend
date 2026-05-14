/**
 * @module src/api/v1/generateFromSingleImage
 * 
 * @description This module defines the `generateFromSingleImage` function, which handles 
 * the generation of an image based on a single uploaded image. It validates the input parameters,
 * checks the uploaded file, and interacts with the AI generation function to create a new image. 
 * The generated image URL is stored in the database along with the user ID and the path of the 
 * uploaded image. Finally, it sends a JSON response back to the client indicating the result of 
 * the generation attempt.
 * 
 * The function uses the `ApiDatabase` class to interact with the database for storing generation information,
 * and it also utilizes configuration settings and error handling to ensure a smooth generation process.
 */

import type { Request, Response } from 'express';

import { ApiDatabase } from '../../models/database.ts';
import { Code, maxUploadingFileSize } from '../../types/types.ts';
import { getConfig } from '../../config.ts';
import { requestAIGeneration, serializeFalError } from '../ai.ts';
import { getLogger } from '../../utils/logger.ts';

import { readFileSync } from 'fs';
import { resolve } from 'path';

const logger = getLogger('generate:single');

/**
 * Generates an image based on a single uploaded image.
 * 
 * This function handles the HTTP request for generating an image from a single uploaded image. 
 * It validates the input parameters, checks the uploaded file, and then calls the AI generation 
 * function to create a new image based on the uploaded one. The generated image URL is stored 
 * in the database along with the user ID and the path of the uploaded image. Finally, it sends 
 * a JSON response back to the client indicating the result of the generation attempt.
 * 
 * @param request - The HTTP request object containing the user ID and uploaded file.
 * @param response - The HTTP response object used to send the generation result back to the client.
 * @param db - An instance of the `ApiDatabase` class used to interact with the database for storing 
 * generation information.
 * 
 * @returns A JSON response indicating the result of the image generation attempt.
 */
export async function generateFromSingleImage(
  request: Request,
  response: Response,
  db: ApiDatabase
): Promise<any> {
  logger.info('generation requested', {
    query: request.query,
    file: request.file
      ? {
          name: request.file.originalname,
          size: request.file.size,
          mimetype: request.file.mimetype,
        }
      : null,
  });

  response.status(Code.BadRequest);

  const userIdParam = request.query['user_id'] as string;

  if (!userIdParam) {
    logger.warn('missing user_id');
    return response.json({
      message: 'To generate an image, you must pass a unique user ID as the user-id request parameter.'
    });
  }
  if (!request.file) {
    logger.warn('no file uploaded');
    return response.json({ message: 'No file uploaded.' });
  }
  if (request.file.size > maxUploadingFileSize) {
    logger.warn('file too large', { size: request.file.size, max: maxUploadingFileSize });
    return response.json({ message: 'The size of the uploaded file must not exceed 50 megabytes.' });
  }

  const userId = Number.parseInt(userIdParam);
  if (Number.isNaN(userId)) {
    logger.warn('user_id not numeric', { userIdParam });
    return response.json({ message: 'user_id parameter must be a numeric value.' });
  }

  try {
    const config = getConfig();
    const imageData = readFileSync(request.file.path);
    logger.debug('image read from disk', { path: request.file.path, bytes: imageData.length });

    const startedAt = Date.now();
    const generatedImageUrl = await requestAIGeneration(
      config,
      imageData,
      request.file.originalname,
      request.file.mimetype
    );
    logger.info('AI generation finished', {
      userId,
      durationMs: Date.now() - startedAt,
      generatedImageUrl,
    });

    db.insertGeneration({
      user_id: userId,
      uploaded_images_paths: [resolve(request.file.path)],
      generated_image_path: generatedImageUrl
    });

    response.status(Code.OK)
      .json({
        message: 'Image generated successfully.',
        generated_image_url: generatedImageUrl
      });
  } catch (error: any) {
    logger.error('AI generation error', { falError: serializeFalError(error) });
    response.status(Code.InternalServerError).json({
      message: 'An error occurred during image generation.',
      error: error?.message ?? 'unknown'
    });
  }
}
