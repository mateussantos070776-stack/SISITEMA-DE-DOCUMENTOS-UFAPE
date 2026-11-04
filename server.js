const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Garantir que a pasta de uploads existe localmente
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração de armazenamento mantendo a extensão original
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Armazenamento em memória organizado por candidato (CPF)
let submissoes = [];

// Rota de Upload para múltiplos ficheiros individuais
app.post('/api/upload', upload.fields([
  { name: 'rg', maxCount: 1 },
  { name: 'cpfDoc', maxCount: 1 },
  { name: 'foto', maxCount: 1 },
  { name: 'enem', maxCount: 1 }
]), (req, res) => {
  try {
    const { candidato, cpf } = req.body;
    const files = req.files;

    if (!cpf) {
      return res.status(400).json({ error: 'CPF do candidato é obrigatório.' });
    }

    let submissao = submissoes.find(s => s.cpf === cpf);

    if (!submissao) {
      submissao = {
        id: 'CAND-' + Math.floor(1000 + Math.random() * 9000),
        candidato,
        cpf,
        documentos: {
          rg: { nome: '', path: '', status: 'PENDENTE', obs: '' },
          cpfDoc: { nome: '', path: '', status: 'PENDENTE', obs: '' },
          foto: { nome: '', path: '', status: 'PENDENTE', obs: '' },
          enem: { nome: '', path: '', status: 'PENDENTE', obs: '' }
        }
      };
      submissoes.push(submissao);
    }

    // Processa cada ficheiro enviado
    ['rg', 'cpfDoc', 'foto', 'enem'].forEach(tipo => {
      if (files && files[tipo] && files[tipo][0]) {
        submissao.documentos[tipo] = {
          nome: files[tipo][0].originalname,
          path: `/uploads/${files[tipo][0].filename}`,
          status: 'EM ANÁLISE',
          obs: submissao.documentos[tipo].obs || ''
        };
      }
    });

    res.status(200).json({ success: true, submissao });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno ao processar ficheiros.' });
  }
});

// Rota para listar todas as submissões
app.get('/api/documentos', (req, res) => {
  res.json(submissoes);
});

// Rota para o analista atualizar o status e observação de um documento específico
app.post('/api/analisar-item', (req, res) => {
  const { cpf, tipoDoc, status, observacao } = req.body;
  const submissao = submissoes.find(s => s.cpf === cpf);

  if (submissao && submissao.documentos[tipoDoc]) {
    if (status) submissao.documentos[tipoDoc].status = status;
    if (observacao !== undefined) submissao.documentos[tipoDoc].obs = observacao;
    return res.json({ success: true, submissao });
  }

  res.status(404).json({ error: 'Submissão ou documento não encontrado.' });
});

app.listen(PORT, () => {
  console.log(`Servidor a correr em http://localhost:${PORT}`);
});