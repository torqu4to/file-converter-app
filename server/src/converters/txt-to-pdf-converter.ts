import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

export async function convertTxtToPdf(inputPath: string): Promise<string> {
  try {
    // Lê o arquivo TXT
    const text = await fs.readFile(inputPath, 'utf-8');

    // Cria o arquivo PDF
    const outputPath = path.join(__dirname, '../../converted', `converted-${Date.now()}.pdf`);
    const doc = new PDFDocument();
    const writeStream = createWriteStream(outputPath);

    // Pipe o PDF para o arquivo
    doc.pipe(writeStream);

    // Adiciona o texto ao PDF
    doc.fontSize(12);
    doc.text(text);

    // Finaliza o PDF
    doc.end();

    // Aguarda a escrita do arquivo
    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', () => resolve());
      writeStream.on('error', reject);
    });

    return outputPath;
  } catch (error) {
    throw new Error(`Erro na conversão de TXT para PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
} 