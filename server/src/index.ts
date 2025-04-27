import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { convertImage } from './converters/image-converter'

const app = express();
const upload = multer({ dest: 'uploads/' });  // Pasta temporária
app.use(express.json());

const allowedOrigins = [
  'https://konvrt-app.vercel.app/', // URL do frontend
  'https://konvrt-jcq2gyanv-torqu4tos-projects.vercel.app', // URL alternativa
  'http://localhost:5173' // Para desenvolvimento local
];
// Libera acesso do frontend (substitua pela URL do seu frontend em produção)
app.use(cors({
  origin: function (origin, callback) {
    // Permite requests sem origin (como mobile apps ou curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      const msg = `A origem ${origin} não tem acesso a este servidor.`;
      return callback(new Error(msg), false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));



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

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});