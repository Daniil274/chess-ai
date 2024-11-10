import { config } from '../config/config.js';

export class OpeningBook {
    constructor() {
        this.openings = new Map([
            ['rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR', 'Королевский пешечный'],
            ['rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR', 'Ферзевый пешечный'],
            ['rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR', 'Открытая игра'],
            // Добавляем базовые дебюты прямо в код вместо загрузки из файла
        ]);
        this.loaded = true;
    }

    async initialize() {
        // Теперь просто возвращаем Promise.resolve(), так как дебюты уже загружены
        return Promise.resolve();
    }

    identifyOpening(fen) {
        const position = fen.split(' ')[0];
        return this.openings.get(position) || 'Неизвестный дебют';
    }
}