import { allowedFileExtensions, getFileExtension } from "../src/types/types.ts";
import { trace } from "./testhub.ts";

const filenames = ["photo.jpg", "photo.jpeg", "photo.png", "photo", ""];

export function runTest(): void {
  for (const filename of filenames) {
    const fileExtension = getFileExtension(filename);
    trace('fse', 8, `"${filename}":`, 
      fileExtension, allowedFileExtensions.includes(fileExtension));
  }
}
