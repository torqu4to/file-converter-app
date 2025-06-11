[![Deploy na Vercel](https://vercel.com/button)](https://konvrt-app.vercel.app/)

# 📌 Conversor de Arquivos

Um projeto full-stack para conversão de arquivos (JPG → PNG, PDF → DOCX, DOCX → PDF, TXT → PDF, MP3 ↔ WAV), desenvolvido com:
- **Frontend**: Svelte + Tailwind CSS
- **Backend**: Node.js + TypeScript

🔗 **Links**:
- [Frontend na Vercel](https://konvrt-app.vercel.app/)
- [Backend no Render](https://konvrt-app.onrender.com)
- [Repositório no GitHub](https://github.com/torqu4to/file-converter-app)

---

## 🚀 Funcionalidades
- Conversão de **JPG para PNG**
- Conversão de **PDF para DOCX**
- Conversão de **DOCX para PDF**
- Conversão de **TXT para PDF**
- Conversão de **MP3 para WAV** e **WAV para MP3**
- Interface moderna, responsiva e acessível
- Barra de progresso e mensagens de status

---

## 🛠️ Instalação e Execução Local

### 1. Clone o repositório
```bash
git clone https://github.com/torqu4to/file-converter-app.git
cd file-converter-app
```

### 2. Instale as dependências do backend
```bash
cd server
npm install
```

### 3. Instale as dependências do frontend
```bash
cd ../client
npm install
```

### 4. Configure variáveis de ambiente
No backend, crie um arquivo `.env` com sua chave da API do CloudConvert:
```
CLOUDCONVERT_API_KEY=sua_chave_aqui
```

### 5. Rode o backend
```bash
cd server
npm run dev
```

### 6. Rode o frontend
Abra outro terminal:
```bash
cd client
npm run dev
```
Acesse: http://localhost:5173

---

## 💡 Como Usar
1. Escolha o tipo de conversão desejado.
2. Faça upload do arquivo.
3. Clique em "Converter" e aguarde o download automático.

---

## ⚠️ Observações
- O backend utiliza a API do CloudConvert, que possui limites gratuitos.
- Para produção, configure as URLs do backend e frontend conforme o ambiente.


