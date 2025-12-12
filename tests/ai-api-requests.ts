import { config } from 'dotenv';
import { fal } from "@fal-ai/client";

import { trace } from './testhub';

export async function runTest(): Promise<void> {
  config({ quiet: true });

  fal.config({
    credentials: process.env.FAL_KEY
  });

  const imageData = ''; // FIXME: Binary data must be here.
  const file = new File([imageData], "image.jpg", { type: "image/jpeg" });
  const url = await fal.storage.upload(file);

  const result = await fal.subscribe("fal-ai/trellis", {
    input: {
      image_url: url
    }
  });

  trace('ai-api-requests', 23, Object.getOwnPropertyNames(result));
}
