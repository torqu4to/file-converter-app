import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { convertImage } from './converters/image-converter'

const app = express();
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// app.use(express.json());

const allowedOrigins = [
  'https://konvrt-app.vercel.app',
  'https://konvrt-app-git-main-torqu4tos-projects.vercel.app',
  'http://localhost:5173'
];


app.use(cors({
  origin: (origin, callback) => {
    // Permite requisições sem origin (como mobile apps ou curl)
    if (!origin) return callback(null, true);

    // Verifica se o domínio está na lista branca
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // // Verifica subdomínios do Vercel
    // if (origin.endsWith('.vercel.app')) {
    //   return callback(null, true);
    // }

    console.log(`Origem bloqueada: ${origin}`);
    return callback(new Error('Acesso bloqueado por CORS'), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 204,
  preflightContinue: false,
  maxAge: 86400
}));

// Middleware para log de requisições (útil para debug)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
    origin: req.headers.origin,
    'user-agent': req.headers['user-agent']
  });
  next();
});

// Rota de exemplo: Conversão de imagem (JPG → PNG)
app.post('/convert/jpg-to-png', upload.single('file'), async (req, res) => {

  console.log('Iniciando conversão...', {
    file: req.file ? {
      name: req.file.originalname,
      size: req.file.size,
      path: req.file.path
    } : null
  });

  if (!req.file) {
    console.error('Nenhum arquivo recebido');
    res.status(400).send('Nenhum arquivo enviado.');
    return;
  }

  try {
    const outputPath = await convertImage(req.file.path, 'png');
    res.download(outputPath);
  } catch (error) {
    res.status(500).send('Erro na conversão.');
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'live',
    cors: {
      allowedOrigins,
      currentOrigin: req.headers.origin,
      isAllowed: allowedOrigins.includes(req.headers.origin || '')
    }
  });
});

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log('Origens permitidas:', allowedOrigins);
});