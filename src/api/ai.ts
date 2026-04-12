import { fal } from '@fal-ai/client';
import { type Config } from '../config.ts';

export async function requestAIGeneration(
  config: Config,
  imageData: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  fal.config({
    credentials: config.api.key
  });

  const file = new File([imageData], fileName, { type: mimeType });
  const url = await fal.storage.upload(file);

  const result: any = await fal.subscribe('fal-ai/trellis', {
    input: {
      image_url: url
    }
  });

  return result.data.model_mesh.url;
}

export interface ImageInput {
  data: Buffer;
  name: string;
  mimeType: string;
}

export async function requestMultiImageAIGeneration(
  config: Config,
  images: ImageInput[]
): Promise<string> {
  fal.config({
    credentials: config.api.key
  });

  const uploadPromises = images.map(image => {
    const file = new File([image.data], image.name, { type: image.mimeType });
    return fal.storage.upload(file);
  });

  const urls = await Promise.all(uploadPromises);

  const result: any = await fal.subscribe('fal-ai/trellis/multi', {
    input: {
      image_urls: urls
    }
  });

  return result.data.model_mesh.url;
}
