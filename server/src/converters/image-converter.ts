import sharp from 'sharp';
import fs from 'fs/promises';

export async function convertImage(inputPath: string, format: 'png' | 'jpeg') {
  const outputPath = `output.${format}`;
  await sharp(inputPath).toFormat(format).toFile(outputPath);
  return outputPath;
}