import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de compressão para melhorar a velocidade de carregamento
app.use(compression());

// Servir os arquivos estáticos da pasta 'dist'
app.use(express.static(path.join(__dirname, 'dist')));

// Lógica de SPA: Redireciona todas as rotas para o index.html
// Isso permite que o React Router assuma o controle das rotas no frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`
  🚀 Servidor Danzamerica rodando com sucesso!
  🌍 Local: http://localhost:${PORT}
  📁 Servindo arquivos de: ${path.join(__dirname, 'dist')}
  `);
});
