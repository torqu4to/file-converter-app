import axios from 'axios';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

// Fila de jobs para evitar exceder o limite de jobs simultâneos
let jobQueue: Promise<any> = Promise.resolve();
let activeJobs = 0;
const MAX_CONCURRENT_JOBS = 2; // Limite de jobs simultâneos
const RETRY_DELAY = 2000; // 2 segundos entre tentativas

async function waitForJobSlot(): Promise<void> {
  while (activeJobs >= MAX_CONCURRENT_JOBS) {
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
  }
  activeJobs++;
}

async function releaseJobSlot(): Promise<void> {
  activeJobs--;
}

export async function convertPdfToDocx(inputPath: string): Promise<string> {
  try {
    // Valida se o arquivo é um PDF válido
    const pdfBytes = await fs.readFile(inputPath);
    await PDFDocument.load(pdfBytes); // Lança erro se não for PDF

    // Configura a API do CloudConvert (plano gratuito)
    const API_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiZTI2N2U4ZTJjYjg5NjQxMjE4NDQyOTFhMzQ1NmQzNzQ2OGMwMDA4ZGU3ZGFhZTQwMWE4NTljZjRhYzE3Yzc2NzgyNmRhYjM5NWVkMzYyMGYiLCJpYXQiOjE3NDcyNzMwMzYuMTExOTk5LCJuYmYiOjE3NDcyNzMwMzYuMTEyMDAxLCJleHAiOjQ5MDI5NDY2MzYuMTA2OTkxLCJzdWIiOiI3MTkzMTI0MyIsInNjb3BlcyI6WyJ1c2VyLnJlYWQiLCJ1c2VyLndyaXRlIiwidGFzay5yZWFkIiwidGFzay53cml0ZSIsIndlYmhvb2sucmVhZCIsIndlYmhvb2sud3JpdGUiLCJwcmVzZXQucmVhZCIsInByZXNldC53cml0ZSJdfQ.hImW-6DsOB0opyXgc5f_0vgQl75mdgBHOB9bxMgkIBD2CbBkzZkpVvCZJCyB0YGU8U_vDQ8VqESrq0W8AuZtASWNGWNIeCmYdsgk5N5M51zLFlwlIS5uESyoXVTRMx6A6XHz0CmoIpfMB9jxBgMZTfOvPCSYS_jwRUG0Gte5pSsVi1QWxg2Kc_KoUunQUAXV7A2fFFfqBHUpqwbdaINmFd_N6nmDnn4Yg-bs7n0irJqARMTsGHTFKZRK_4nsZg4JcZe6YxC71IXF1hn92-ZDMHua_FV2zE7ct5n9lanI_hOIYTA1zOYMHsIS0GnG-tQG5m4_jxclU97jmoeI0bZBZvrs0guxHcdBMyVlZTSt8rQVLcEDeoNb33HmHtS-bVftERLzNYmtahurV0JPaYr76SFuHAQb-wjXPV0X2llkxJaxbIC5XL7OHLj2u99LXx7W5tLuOc6cWgXbeCWS9mcM9o68iODwFq2KKO3JbodDGsrK4BtkSA913TAANGR6i4iNEDcgG8FmD9RM5EGhqo6ulS2nIPpZR-tnFM75xsHPcy5eAVn8xtDVoEMICLWYyb3ovrDmrSzHuvnQ3jBFmhbv5161pBVJMG5G0LiRfhPDsgNzCdVGgTC-xDGx2ltCbFy1MNGF31fFvHGb6S6tm4-zSjPvsmGbW4YAJYr0E1O5dlU';
    const cloudconvert = axios.create({
      baseURL: 'https://api.cloudconvert.com/v2',
      headers: { 'Authorization': `Bearer ${API_KEY}` },
    });

    // Adiciona o job à fila
    return await jobQueue.then(async () => {
      try {
        await waitForJobSlot();
        console.log('Criando job de conversão...');

        // Passo 1: Cria um job de conversão
        const { data: job } = await cloudconvert.post('/jobs', {
          tasks: {
            'upload': { operation: 'import/upload' },
            'convert': {
              operation: 'convert',
              input: ['upload'],
              output_format: 'docx',
              engine: 'libreoffice',
            },
            'export': { operation: 'export/url', input: ['convert'] },
          },
        });

        console.log('Resposta da API:', JSON.stringify(job, null, 2));

        if (!job.data || !job.data.tasks) {
          throw new Error('Resposta inválida da API CloudConvert');
        }

        // Passo 2: Faz upload do PDF
        const uploadTask = job.data.tasks.find((t: any) => t.name === 'upload');
        console.log('Tarefa de upload:', JSON.stringify(uploadTask, null, 2));

        if (!uploadTask) {
          throw new Error('Tarefa de upload não encontrada na resposta da API');
        }

        // Aguarda a tarefa de upload estar pronta
        let uploadUrl: string | undefined;
        let uploadAttempts = 0;
        const maxUploadAttempts = 10;

        while (uploadAttempts < maxUploadAttempts) {
          const { data: uploadStatus } = await cloudconvert.get(`/tasks/${uploadTask.id}`);
          console.log('Status do upload:', JSON.stringify(uploadStatus, null, 2));

          if (uploadStatus.status === 'finished' && uploadStatus.result && uploadStatus.result.url) {
            uploadUrl = uploadStatus.result.url;
            break;
          }

          if (uploadStatus.status === 'error') {
            throw new Error(`Erro na preparação do upload: ${uploadStatus.message || 'Erro desconhecido'}`);
          }

          await new Promise(resolve => setTimeout(resolve, 1000));
          uploadAttempts++;
        }

        if (!uploadUrl) {
          throw new Error('URL de upload não disponível após várias tentativas');
        }

        console.log('Fazendo upload do arquivo...');
        await axios.put(uploadUrl, pdfBytes, {
          headers: { 'Content-Type': 'application/octet-stream' },
        });

        // Passo 3: Aguarda a conclusão e baixa o DOCX
        console.log('Aguardando conversão...');
        const convertTask = job.data.tasks.find((t: any) => t.name === 'convert');
        if (!convertTask || !convertTask.id) {
          throw new Error('ID da tarefa de conversão não encontrado');
        }

        let convertedUrl: string | undefined;
        let attempts = 0;
        const maxAttempts = 30; // 30 segundos de timeout

        while (attempts < maxAttempts) {
          const { data: status } = await cloudconvert.get(`/tasks/${convertTask.id}`);
          if (status.status === 'finished') {
            if (!status.result || !status.result.files || !status.result.files[0] || !status.result.files[0].url) {
              throw new Error('URL do arquivo convertido não encontrada');
            }
            convertedUrl = status.result.files[0].url;
            break;
          }
          if (status.status === 'error') {
            throw new Error(`Erro na conversão: ${status.message || 'Erro desconhecido'}`);
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        }

        if (!convertedUrl) {
          throw new Error('Timeout na conversão do arquivo');
        }

        // Passo 4: Salva o DOCX localmente
        console.log('Baixando arquivo convertido...');
        const outputPath = path.join(__dirname, '../../outputs', `converted-${Date.now()}.docx`);
        const { data: docxBuffer } = await axios.get(convertedUrl, { responseType: 'arraybuffer' });
        await fs.writeFile(outputPath, docxBuffer);

        console.log('Conversão concluída com sucesso!');
        return outputPath;
      } finally {
        await releaseJobSlot();
      }
    });
  } catch (error) {
    console.error('Erro na conversão:', error);
    throw error;
  }
}