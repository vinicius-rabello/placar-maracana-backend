const express = require("express");
const multer = require("multer");
const path = require("path");


const app = express();
const PORT = 8080;

// pasta onde os .bin ficam
const BIN_DIR = path.resolve('bins');

// servir arquivos estáticos
app.use('/bins', express.static(BIN_DIR));

// upload
const upload = multer({ dest: BIN_DIR });

app.post('/upload', upload.single('file'), (req, res) => {
  res.json({ ok: true, filename: req.file.filename });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
