const express = require('express');
const displayService = require('./services/displayService');

const app = express();
app.use(express.json());

// Endpoint para o front salvar config
app.post('/config', (req, res) => {
    const config = displayService.updateConfig(req.body);
    res.json({ success: true, config });
});

// Endpoint para o ESP pegar o .bin
app.post('/display', async (req, res) => {
    const bin = await displayService.generateBinary();
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(bin);
});

// Inicializar
displayService.initialize().then(() => {
    app.listen(3000, () => console.log('Servidor rodando'));
});