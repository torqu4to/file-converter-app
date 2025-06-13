import express, { Express, Request, Response, NextFunction } from 'express';
import multer, { Multer, FileFilterCallback } from 'multer';
import cors, { CorsOptions } from 'cors';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { convertPdfToDocx } from './converters/pdf-converter';
import { convertDocxToPdf } from './converters/docx-to-pdf-converter';
import { convertTxtToPdf } from './converters/txt-to-pdf-converter';
import { convertAudio } from './converters/audio-converter';

// 1. Configuração do Express
const app: Express = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

// 2. Tipagem para o arquivo recebido
interface UploadedFile extends Express.Multer.File {
  originalname: string;
  path: string;
}

// 3. Configuração segura do Multer
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'audio/mpeg',
    'audio/wav'
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não suportado'));
  }
};

const upload: Multer = multer({
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter
});

// 4. Configuração explícita do CORS
const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      'https://konvrt-app.vercel.app',
      'http://localhost:5173'
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Acesso não permitido por CORS'));
    }
  },
  methods: ['GET', 'POST']
};

app.use(cors(corsOptions));
app.use(express.json());

// 5. Middleware de tratamento de erros tipado
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Erro interno no servidor',
    message: err.message
  });
});


// 6. Rota de conversão com tipagem completa
app.post('/convert/jpg-to-png', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Nenhum arquivo enviado' });
      return;
    }

    const file = req.file as UploadedFile;
    const outputFilename = `converted-${Date.now()}.png`;
    const outputPath = path.join(__dirname, '..', 'converted', outputFilename);

    // 7. Garante que o diretório de saída existe
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    // 8. Processamento de imagem com tratamento de erro
    await sharp(file.path)
      .toFormat('png')
      .toFile(outputPath);

    // 9. Limpeza dos arquivos temporários
    await fs.unlink(file.path);

    // 10. Resposta segura com tipos
    res.download(outputPath, outputFilename, async (err) => {
      if (err) {
        console.error('Erro ao enviar arquivo:', err);
        res.status(500).json({ error: 'Erro ao enviar arquivo' });
      }
      await fs.unlink(outputPath); // Remove o arquivo após download
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Erro na conversão:', error);
      res.status(500).json({
        error: 'Falha na conversão',
        details: error.message
      });
    } else {
      res.status(500).json({ error: 'Erro desconhecido' });
    }
  }
});

app.post('/convert/pdf-to-docx', upload.single('file'), async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).send('Nenhum arquivo enviado.');
    return;
  }

  try {
    const outputPath = await convertPdfToDocx(req.file.path);
    res.download(outputPath, () => {
      // Limpa os arquivos temporários
      if (req.file) {
        fs.unlink(req.file.path);
      }
      fs.unlink(outputPath);
    });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro na conversão. Certifique-se de que o arquivo é um PDF válido.');
    return;
  }
});

app.post('/convert/docx-to-pdf', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Nenhum arquivo enviado' });
      return;
    }

    const outputFilename = `converted-${Date.now()}.pdf`;
    const outputPath = path.join(__dirname, '..', 'converted', outputFilename);

    // Garante que o diretório de saída existe
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    await convertDocxToPdf(req.file.path, outputPath);

    res.download(outputPath, outputFilename, async (err) => {
      if (err) {
        console.error('Erro ao enviar arquivo:', err);
        res.status(500).json({ error: 'Erro ao enviar arquivo' });
      }
      // Limpa os arquivos temporários
      if (req.file) {
        await fs.unlink(req.file.path);
      }
      await fs.unlink(outputPath);
    });
  } catch (error) {
    console.error('Erro na conversão:', error);
    res.status(500).json({
      error: 'Falha na conversão',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

app.post('/convert/txt-to-pdf', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Nenhum arquivo enviado' });
      return;
    }

    const outputPath = await convertTxtToPdf(req.file.path);
    res.download(outputPath, () => {
      // Limpa os arquivos temporários
      if (req.file) {
        fs.unlink(req.file.path);
      }
      fs.unlink(outputPath);
    });
  } catch (error) {
    console.error('Erro na conversão:', error);
    res.status(500).json({
      error: 'Falha na conversão',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

app.post('/convert/audio', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Nenhum arquivo enviado' });
      return;
    }

    const targetFormat = req.body.targetFormat as 'mp3' | 'wav';
    if (!targetFormat || !['mp3', 'wav'].includes(targetFormat)) {
      res.status(400).json({ error: 'Formato de destino inválido' });
      return;
    }

    const outputPath = await convertAudio(req.file.path, targetFormat);
    res.download(outputPath, () => {
      // Limpa os arquivos temporários
      if (req.file) {
        fs.unlink(req.file.path);
      }
      fs.unlink(outputPath);
    });
  } catch (error) {
    console.error('Erro na conversão:', error);
    res.status(500).json({
      error: 'Falha na conversão',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// 11. Inicialização segura do servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
}).on('error', (err: Error) => {
  console.error('Falha ao iniciar servidor:', err);
  process.exit(1);
});

// 12. Tratamento de sinais para shutdown graceful
process.on('SIGTERM', () => {
  console.log('Recebido SIGTERM. Encerrando servidor...');
  process.exit(0);
});