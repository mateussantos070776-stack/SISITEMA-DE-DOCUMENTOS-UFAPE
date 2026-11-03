const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

let documentos = [];

app.post('/api/upload', upload.single('documento'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });

  const { candidato, cpf } = req.body;
  if (!candidato || !cpf) {
    return res.status(400).json({ error: 'Nome e CPF são obrigatórios.' });
  }

  const novoDoc = {
    id: Date.now().toString().slice(-6),
    candidato: candidato.trim(),
    cpf: cpf.trim(),
    nomeArquivo: req.file.originalname,
    path: `/uploads/${req.file.filename}`,
    status: 'PENDENTE',
    observacao: ''
  };

  documentos.push(novoDoc);
  res.status(201).json({ status: 'Sucesso', documento: novoDoc });
});

app.get('/api/documentos', (req, res) => {
  res.json(documentos);
});

app.patch('/api/documentos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status, observacao } = req.body;

    const doc = documentos.find(d => d.id === id);
    if (!doc) return res.status(404).json({ error: 'Documento não encontrado.' });

    if (status !== undefined) doc.status = status;
    if (observacao !== undefined) doc.observacao = observacao;

    res.json({ status: 'Sucesso', documento: doc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});