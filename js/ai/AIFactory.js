import { StockfishAI } from './StockfishAI.js';
import { HumanPlayer } from '../models/Player.js';

export class AIFactory {
    static create(type, color) {
        // Нормализуем тип (приводим к нижнему регистру и убираем лишние слова)
        const cleanType = type.toLowerCase()
            .replace('player', '')
            .replace('ai', '')
            .replace('stockfish', 'stockfish')
            .trim();
        
        switch (cleanType) {
            case 'stockfish':
            case 'stockfishai':
                return new StockfishAI(color);
            case 'human':
            default:
                return new HumanPlayer(color);
        }
    }
}