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

    reset() {
        this.chess.reset();
        this.moveHistory = [];
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