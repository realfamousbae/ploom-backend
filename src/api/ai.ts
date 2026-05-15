/**
 * @module src/api/ai
 * 
 * @description This module provides functions to interact with the AI service for generating 3D 
 * models based on input images. It includes functions for requesting AI generation for both single 
 * and multiple images. The functions handle uploading the images to a storage service and then 
 * sending the URLs to the AI service for processing. The AI service returns a URL for the generated 
 * model mesh based on the input images.
 */

import { fal } from '@fal-ai/client';
import { type Config } from '../config.ts';
import { getLogger } from '../utils/logger.ts';

const logger = getLogger('ai');

/**
 * Requests AI generation for a single image.
 * 
 * This function takes in the configuration object containing API credentials, the image data as 
 * a Buffer, the name of the file being uploaded, and the MIME type of the image. 
 * It uploads the image to the storage service and then sends the URL of the uploaded 
 * image to the AI service for processing. The AI service returns a URL for the generated 
 * model mesh based on the input image.
 * 
 * @param config - The configuration object containing API credentials.
 * @param imageData - The image data as a Buffer to be uploaded and processed by the AI model.
 * @param fileName - The name of the file being uploaded, used for storage and identification purposes.
 * @param mimeType - The MIME type of the image being uploaded, which helps the server understand 
 * the format of the file.
 * 
 * @returns A promise that resolves to the URL of the generated model mesh returned by the AI service.
 */
export async function requestAIGeneration(
  config: Config,
  imageData: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  logger.info('single-image generation start', { fileName, mimeType, bytes: imageData.length });
  fal.config({
    credentials: config.api.key
  });

  const file = new File([new Uint8Array(imageData)], fileName, { type: mimeType });
  const uploadStarted = Date.now();
  const url = await fal.storage.upload(file);
  logger.debug('image uploaded to fal storage', { url, durationMs: Date.now() - uploadStarted });

  const subscribeStarted = Date.now();
  const result: any = await fal.subscribe('fal-ai/trellis-2', {
    input: {
      image_url: url
    },
    logs: true
  });
  logger.info('fal.trellis-2 returned', { durationMs: Date.now() - subscribeStarted });

  return result.data.model_glb.url;
}

/**
 * Interface representing the input for requesting multi-image AI generation. 
 * It includes the image data as a Buffer, the name of the file, and the MIME type of the image.
 * 
 * This structure is used to encapsulate the necessary information for uploading multiple images 
 * and requesting AI generation based on those images.
 */
export interface ImageInput {
  data: Buffer;
  name: string;
  mimeType: string;
}

/**
 * Requests AI generation for multiple images. It uploads each image to the storage service and then
 * sends the URLs of the uploaded images to the AI service for processing. The AI service returns a 
 * URL for the generated model mesh based on the input images.
 * 
 * @param config - The configuration object containing API credentials.
 * @param images - An array of `ImageInput` objects, each containing the image data, file name, 
 * and MIME type for the images to be processed.
 * 
 * @returns A promise that resolves to the URL of the generated model mesh returned by the AI service.
 */
export async function requestMultiImageAIGeneration(
  config: Config,
  images: ImageInput[]
): Promise<string> {
  logger.info('multi-image generation start', {
    count: images.length,
    totalBytes: images.reduce((acc, i) => acc + i.data.length, 0),
  });
  fal.config({
    credentials: config.api.key
  });

  const uploadStarted = Date.now();
  const uploadPromises = images.map(image => {
    const file = new File([new Uint8Array(image.data)], image.name, { type: image.mimeType });
    return fal.storage.upload(file);
  });

  const urls = await Promise.all(uploadPromises);
  logger.debug('all images uploaded to fal storage', {
    count: urls.length,
    durationMs: Date.now() - uploadStarted,
  });

  const subscribeStarted = Date.now();
  const result: any = await fal.subscribe('fal-ai/trellis/multi', {
    input: {
      image_urls: urls
    }
  });
  logger.info('fal.trellis/multi returned', { durationMs: Date.now() - subscribeStarted });

  return result.data.model_mesh.url;
}
