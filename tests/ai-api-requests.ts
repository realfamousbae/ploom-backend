import { fal } from '@fal-ai/client';

import { getConfig } from '../src/config.ts';
import { joinWithCwd } from '../src/types/types.ts';
import { trace } from './testhub.ts';

import { readFileSync } from 'fs';

export async function testAIApi(): Promise<void> {
  const config = getConfig();

  fal.config({
    credentials: config.api.key
  });

  const cupPhotoPath = joinWithCwd('/tests/cup.jpeg');
  const imageData = readFileSync(cupPhotoPath);
  const file = new File([imageData], 'cup.jpeg', { type: 'image/jpeg' }); // Autocomplete extension must be added.
  const url = await fal.storage.upload(file);

  const result = await fal.subscribe('fal-ai/trellis', {
    input: {
      image_url: url
    }
  });

  trace('ai-api-requests', 27, result.data.model_mesh.url);
  trace('ai-api-requests', 28, result.data.model_mesh.content_type);
  trace('ai-api-requests', 29, result.data.model_mesh.file_data);
  trace('ai-api-requests', 30, Object.getOwnPropertyNames(result.data.model_mesh));
}

export async function runTest(id: number): Promise<void> {
  const response = await fetch('http://localhost:5173/');
  
  if (!response.ok) {
    throw new Error(`Ошибка: ${response.status}`);
  }

  console.log(response);
}
