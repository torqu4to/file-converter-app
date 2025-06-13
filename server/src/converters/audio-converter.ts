import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import path from 'path';

export async function convertAudio(inputPath: string, targetFormat: 'mp3' | 'wav'): Promise<string> {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(__dirname, '../../converted', `converted-${Date.now()}.${targetFormat}`);

    ffmpeg(inputPath)
      .toFormat(targetFormat)
      .on('end', () => {
        resolve(outputPath);
      })
      .on('error', (err) => {
        reject(new Error(`Erro na conversão de áudio: ${err.message}`));
      })
      .save(outputPath);
  });
} 