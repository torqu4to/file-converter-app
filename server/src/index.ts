import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { convertImage } from './converters/image-converter'

const app = express();
const upload = multer({ dest: 'uploads/' });

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
    if (allowedOrigins.some(allowedOrigin =>
      origin === allowedOrigin ||
      origin.endsWith(`.${allowedOrigin.replace('https://', '')}`)
    )) {
      return callback(null, true);
    }

    const error = new Error('Acesso bloqueado por CORS');
    console.error(`Origem bloqueada: ${origin}`);
    return callback(error, false);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200 // Para navegadores antigos
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
  if (!req.file) {
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