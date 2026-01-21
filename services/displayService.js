const fs = require('fs').promises;
const path = require('path');

// Constantes (mesmas do frontend)
const CHAR_SPACING = 1;
const DISPLAY_WIDTH = 256;
const DISPLAY_HEIGHT = 64;
const SCORE_MARGIN = 20;
const CLOCK_X = 100;
const CLOCK_Y = 28;

// Classe para simular o display de pixels
class PixelDisplay {
    constructor() {
        this.pixels = new Array(DISPLAY_WIDTH * DISPLAY_HEIGHT).fill(false);
    }

    setPixel(x, y, on = true) {
        if (x >= 0 && x < DISPLAY_WIDTH && y >= 0 && y < DISPLAY_HEIGHT) {
            const index = y * DISPLAY_WIDTH + x;
            this.pixels[index] = on;
        }
    }

    getPixel(x, y) {
        if (x >= 0 && x < DISPLAY_WIDTH && y >= 0 && y < DISPLAY_HEIGHT) {
            const index = y * DISPLAY_WIDTH + x;
            return this.pixels[index];
        }
        return false;
    }

    clear() {
        this.pixels.fill(false);
    }

    clearArea(startX, startY, width, height) {
        for (let y = startY; y < startY + height; y++) {
            for (let x = startX; x < startX + width; x++) {
                this.setPixel(x, y, false);
            }
        }
    }
}

class DisplayService {
    constructor() {
        this.charCache = {};
        this.maracanaData = null;
        this.currentConfig = {
            homeTeam: '',
            awayTeam: '',
            homeScore: '',
            awayScore: ''
        };
    }

    // Carregar imagem
    async loadImage(imageName) {
        try {
            const data = await fs.readFile(
                path.join(__dirname, `../assets/bitfiles/${imageName}.json`),
                'utf8'
            );
            const json = JSON.parse(data);
            return json.bitlines;
        } catch (error) {
            console.warn(`Imagem ${imageName} não encontrada`);
            return null;
        }
    }

    // Carregar caractere
    async loadChar(char) {
        if (this.charCache[char]) {
            return this.charCache[char];
        }

        try {
            let filename = char;
            if (char === ':') {
                filename = 'dois-pontos';
            }

            const data = await fs.readFile(
                path.join(__dirname, `../assets/bitfiles/${filename}.json`),
                'utf8'
            );
            const json = JSON.parse(data);
            this.charCache[char] = json.bitlines;
            return json.bitlines;
        } catch (error) {
            console.warn(`Caractere ${char} não encontrado`);
            return null;
        }
    }

    // Desenhar imagem no display
    drawImage(display, bitlines, startX, startY) {
        if (!bitlines) return;

        for (let y = 0; y < bitlines.length; y++) {
            const line = bitlines[y];
            for (let x = 0; x < line.length; x++) {
                if (line[x] === '1') {
                    display.setPixel(startX + x, startY + y, true);
                }
            }
        }
    }

    // Desenhar caractere no display
    drawChar(display, bitlines, startX, startY) {
        if (!bitlines) return 7;

        for (let y = 0; y < bitlines.length && y < 7; y++) {
            const line = bitlines[y];
            for (let x = 0; x < line.length && x < 7; x++) {
                if (line[x] === '1') {
                    display.setPixel(startX + x, startY + y, true);
                }
            }
        }
        return 7;
    }

    // Renderizar texto no display
    async renderText(display, text, startX, startY) {
        let currentX = startX;

        for (let char of text.toUpperCase()) {
            const bitlines = await this.loadChar(char);
            const charWidth = this.drawChar(display, bitlines, currentX, startY);
            currentX += charWidth + CHAR_SPACING;
        }
    }

    // Renderizar texto no display
    async renderClock(display, text, startX, startY) {
        let currentX = startX;

        for (let char of text.toUpperCase()) {
            const bitlines = await this.loadChar(char);
            const charWidth = this.drawChar(display, bitlines, currentX, startY);
            currentX += 4 + CHAR_SPACING;
        }
    }

    // Obter hora atual formatada
    getCurrentTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    // Gerar display completo
    async generateDisplay(config) {
        const display = new PixelDisplay();

        // Desenhar relógio
        const currentTime = this.getCurrentTime();
        await this.renderClock(display, currentTime, CLOCK_X, CLOCK_Y);

        // Desenhar imagem escolhida
        if (config.image) {
            const image = await this.loadImage(config.image);
            if (image) {
                this.drawImage(display, image, 0, 20);
            }
        }

        // Renderizar time mandante na linha 5
        if (config.homeTeam) {
            await this.renderText(display, config.homeTeam, 150, 21);
            const homeLogo = await this.loadImage(config.homeTeam);
            if (homeLogo) {
                this.drawImage(display, homeLogo, 120, 0);
            }
        }

        // Renderizar placar mandante
        if (config.homeScore !== '') {
            const scoreX = DISPLAY_WIDTH - SCORE_MARGIN;
            await this.renderText(display, config.homeScore.toString(), scoreX, 21);
        }

        // Renderizar time visitante na linha 20
        if (config.awayTeam) {
            await this.renderText(display, config.awayTeam, 150, 36);
            const awayLogo = await this.loadImage(config.awayTeam);
            if (awayLogo) {
                this.drawImage(display, awayLogo, 120, 32);
            }
        }

        // Renderizar placar visitante
        if (config.awayScore !== '') {
            const scoreX = DISPLAY_WIDTH - SCORE_MARGIN;
            await this.renderText(display, config.awayScore.toString(), scoreX, 36);
        }

        return display;
    }

    // Converter display para binário (mesma lógica do frontend)
    displayToBinary(display) {
        const OUT_W = 256;
        const OUT_H = 64;
        const bytesPerRow = OUT_W / 8; // 16
        const totalBytes = OUT_H * bytesPerRow; // 1024 bytes
        const buffer = Buffer.alloc(totalBytes);

        let i = 0;
        for (let yOut = 0; yOut < OUT_H; yOut++) {
            for (let byteIndex = 0; byteIndex < bytesPerRow; byteIndex++) {
                let byte = 0;

                for (let bit = 0; bit < 8; bit++) {
                    const xOut = byteIndex * 8 + bit;

                    let xIn, yIn;
                    if (yOut < 64) {
                        xIn = xOut;
                        yIn = yOut;
                    } else {
                        xIn = xOut + 256;
                        yIn = yOut - 64;
                    }

                    if (display.getPixel(xIn, yIn)) {
                        byte |= (1 << bit); // LSB-first (XBM)
                    }
                }

                buffer[i++] = byte;
            }
        }

        return buffer;
    }

    // Atualizar configuração
    updateConfig(config) {
        this.currentConfig = {
            homeTeam: config.homeTeam || '',
            awayTeam: config.awayTeam || '',
            homeScore: config.homeScore !== undefined ? config.homeScore : '',
            awayScore: config.awayScore !== undefined ? config.awayScore : '',
            image: config.image !== undefined ? config.image : 'maracana.json'
        };
        return this.currentConfig;
    }

    // Obter configuração atual
    getConfig() {
        return this.currentConfig;
    }

    // Gerar binário completo (método principal)
    async generateBinary() {
        const display = await this.generateDisplay(this.currentConfig);
        return this.displayToBinary(display);
    }

    // Inicializar serviço
    async initialize() {
        // await this.loadMaracana();
        console.log('DisplayService inicializado');
    }
}

// Exportar instância única (singleton)
module.exports = new DisplayService();