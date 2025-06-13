import { promises as fs } from 'fs';
import path from 'path';
import libre from 'libreoffice-convert';
import { promisify } from 'util';

const convertAsync = promisify(libre.convert);

export async function convertDocxToPdf(inputPath: string, outputPath: string): Promise<void> {
  try {
    // Lê o arquivo DOCX
    const docxBuffer = await fs.readFile(inputPath);

    // Converte para PDF
    const pdfBuffer = await convertAsync(docxBuffer, '.pdf', undefined);

    // Salva o arquivo PDF
    await fs.writeFile(outputPath, pdfBuffer);

  } catch (error) {
    console.error('Erro ao converter DOCX para PDF:', error);
    throw new Error('Falha na conversão de DOCX para PDF');
  }
} 