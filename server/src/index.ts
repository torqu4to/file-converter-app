import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { convertImage } from './converters/image-converter'

const app = express();
const upload = multer({ dest: 'uploads/' });  // Pasta temporária

// Libera acesso do frontend (substitua pela URL do seu frontend em produção)
app.use(cors({
  origin: 'http://localhost:5173',  // Ou '*' para desenvolvimento (não use em produção)
  methods: ['GET', 'POST'],
}));

app.use(express.json());

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

app.listen(3000, () => console.log('Backend rodando em http://localhost:3000'));