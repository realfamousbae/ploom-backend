/**
 * @module src/api/ai
 *
 * @description This module provides functions to interact with the fal.ai service for
 * generating 3D models from input images. It exposes two flows:
 *
 * - {@link requestAIGeneration} — single-image generation via `fal-ai/trellis-2`.
 * - {@link requestMultiImageAIGeneration} — multi-image generation that first tries the
 *   (currently undocumented) `fal-ai/trellis-2/multi` endpoint and transparently falls
 *   back to the legacy `fal-ai/trellis/multi` model when the v2 multi endpoint is not
 *   available (404 / Not Found).
 *
 * Output URLs come from `result.data.model_glb.url` for Trellis-2 and
 * `result.data.model_mesh.url` for the legacy v1 multi fallback. Both flows are exposed
 * to upstream callers as a single string URL so the public HTTP API contract does not
 * change.
 */

import { fal } from '@fal-ai/client';
import { type Config } from '../config.ts';
import { getLogger } from '../utils/logger.ts';

const logger = getLogger('ai');

/**
 * Best-effort extraction of diagnostic fields from a fal.ai SDK error. The SDK's
 * {@link ApiError}/{@link ValidationError} classes attach `status`, `body` and
 * `requestId` directly on the error instance, but the default JSON replacer in our
 * logger strips everything except `name`/`message`/`stack`. This helper materialises
 * those fields into a plain object so callers can log them.
 */
export function serializeFalError(err: any): Record<string, unknown> {
  const body = err?.body ?? err?.response?.body;
  return {
    name: err?.name,
    status: err?.status,
    requestId: err?.requestId,
    message: err?.message,
    body,
    fieldErrors: body?.detail,
    stack: err?.stack,
  };
}

/**
 * Requests AI generation for a single image via `fal-ai/trellis-2`.
 *
 * @param config - Configuration object containing fal.ai credentials.
 * @param imageData - Raw image bytes to upload.
 * @param fileName - Original file name (used for the upload).
 * @param mimeType - MIME type of the image being uploaded.
 *
 * @returns URL of the generated `.glb` model.
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
      image_url: url,
    },
    logs: true,
  });
  logger.info('fal.trellis-2 returned', { durationMs: Date.now() - subscribeStarted });

  return result.data.model_glb.url;
}

/**
 * Image input bundle for {@link requestMultiImageAIGeneration}.
 */
export interface ImageInput {
  data: Buffer;
  name: string;
  mimeType: string;
}

/**
 * Requests AI generation for multiple images. First attempts the (currently undocumented)
 * `fal-ai/trellis-2/multi` endpoint with the v2 `image_urls` input. If fal.ai reports the
 * model as missing (HTTP 404 / Not Found), falls back to the legacy `fal-ai/trellis/multi`
 * endpoint, which is known to be live. Any other error is rethrown so the handler can
 * report it.
 *
 * @param config - Configuration object containing fal.ai credentials.
 * @param images - Image bundles to upload and feed to the model.
 *
 * @returns URL of the generated 3D model (`.glb` for Trellis-2, `.glb`/legacy mesh URL
 *          for the Trellis v1 multi fallback).
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

  try {
    const subscribeStarted = Date.now();
    const result: any = await fal.subscribe('fal-ai/trellis-2/multi', {
      input: {
        image_urls: urls,
      },
      logs: true,
    });
    logger.info('fal.trellis-2/multi returned', { durationMs: Date.now() - subscribeStarted });

    return result.data.model_glb?.url ?? result.data.model_mesh?.url;
  } catch (err: any) {
    if (isModelNotFoundError(err)) {
      logger.warn('[generate:multi] trellis-2/multi unavailable, fell back to trellis/multi', {
        falError: serializeFalError(err),
      });

      const subscribeStarted = Date.now();
      const result: any = await fal.subscribe('fal-ai/trellis/multi', {
        input: {
          image_urls: urls,
        },
        logs: true,
      });
      logger.info('fal.trellis/multi (fallback) returned', { durationMs: Date.now() - subscribeStarted });

      return result.data.model_mesh.url;
    }
    throw err;
  }
}

/**
 * Returns true when an error from `@fal-ai/client` looks like "model endpoint does not
 * exist". We only treat HTTP 404 / NotFoundError as such — any other status (422, 500,
 * connection errors, etc.) is a real failure that must surface, not be masked by a
 * silent fallback.
 */
function isModelNotFoundError(err: any): boolean {
  if (err?.status === 404) {
    return true;
  }
  const name = err?.name;
  if (typeof name === 'string' && name.toLowerCase().includes('notfound')) {
    return true;
  }
  return false;
}
