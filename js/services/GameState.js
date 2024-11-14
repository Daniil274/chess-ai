import { EventEmitter } from '../ui/EventEmitter.js';
import { Chess } from '../ExternalLibs.js';

export class GameState extends EventEmitter {
    constructor() {
        super();
        this.chess = new Chess();
        this.moveHistory = [];
    }

    makeMove(move) {
        const result = this.chess.move(move);
        if (result) {
            this.moveHistory.push(result);
            this.emit('move', result);
            
            if (this.chess.game_over()) {
                this.emit('gameOver', {
                    isCheckmate: this.chess.in_checkmate(),
                    isDraw: this.chess.in_draw(),
                    turn: this.chess.turn()
                });
            }
        }
        return result;
    }

    loadFromSavedState(savedState) {
        try {
            // Сбрасываем текущее состояние
            this.reset();

            // Загружаем позицию
            if (savedState.currentFen && savedState.currentFen !== 'start') {
                this.chess.load(savedState.currentFen);
            }

            // Восстанавливаем историю ходов
            if (Array.isArray(savedState.moveHistory)) {
                this.moveHistory = [...savedState.moveHistory];
            }

            this.emit('stateRestored', savedState);
            return true;
        } catch (error) {
            console.error('Error loading saved state:', error);
            return false;
        }
    }

    reset() {
        this.chess.reset();
        this.moveHistory = [];
        this.emit('reset');
    }


    loadPosition(fen) {
        try {
            const success = this.chess.load(fen);
            if (success) {
                this.emit('positionLoaded', fen);
            }
            return success;
        } catch (error) {
            console.error('Error loading position:', error);
            return false;
        }
    }

    restoreHistory(moves) {
        this.moveHistory = [...moves];
        this.emit('historyRestored', moves);
    }
    
    getCurrentFen() {
        return this.chess.fen();
    }

    getMoveHistory() {
        return [...this.moveHistory];
    }
    
    getCurrentState() {
        return {
            fen: this.chess.fen(),
            moveHistory: [...this.moveHistory],
            turn: this.chess.turn(),
            isGameOver: this.chess.game_over(),
            isCheck: this.chess.in_check()
        };
    }

    undo() {
        const move = this.chess.undo();
        if (move) {
            this.moveHistory.pop();
            this.emit('undo', move);
        }
        return move;
    }
}