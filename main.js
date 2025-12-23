const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 8080;

// pasta onde os .bin ficam
const BIN_DIR = path.resolve("bins");

// cors
app.use(cors());

// servir arquivos estáticos
app.use("/bins", express.static(BIN_DIR));

// ===== multer com nome fixo =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, BIN_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, "display.bin"); // 👈 nome fixo
  }
});

const upload = multer({ storage });

app.post("/upload", upload.single("file"), (req, res) => {
  res.json({
    ok: true,
    filename: req.file.filename,
    url: `/bins/${req.file.filename}`
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
