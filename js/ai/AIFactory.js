import { StockfishAI } from './StockfishAI.js';
import { HumanPlayer } from '../models/Player.js';

export class AIFactory {
    static create(type, color) {
        // Нормализуем тип (приводим к нижнему регистру и убираем 'player', 'ai')
        const cleanType = type.toLowerCase()
            .replace('player', '')
            .replace('ai', '');
        
        switch (cleanType) {
            case 'stockfish':
                return new StockfishAI(color);
            case 'human':
                return new HumanPlayer(color);
            default:
                console.warn(`Unknown AI type: ${type}, defaulting to human`);
                return new HumanPlayer(color);
        }
    }
}