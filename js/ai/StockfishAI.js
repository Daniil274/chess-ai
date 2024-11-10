import { BaseAI } from './BaseAI.js';

export class StockfishAI extends BaseAI {
    constructor(color, depth = 15) {
        super(color, 'Stockfish');
        this.depth = depth;
        this.engine = null;
        this.initialize();
    }

    async initialize() {
        try {
            this.engine = new Worker('js/stockfish/stockfish.js');
            this.engine.postMessage('uci');
            this.engine.postMessage('isready');
        } catch (error) {
            console.error('Failed to initialize Stockfish:', error);
        }
    }

    async getMove(position) {
        return new Promise((resolve, reject) => {
            if (!this.engine) {
                reject(new Error('Stockfish not initialized'));
                return;
            }

            const timeout = setTimeout(() => {
                reject(new Error('Stockfish timeout'));
            }, 30000);

            const moveHandler = (e) => {
                const bestMove = e.data.match(/bestmove\s+(\S+)/);
                if (bestMove) {
                    clearTimeout(timeout);
                    this.engine.removeEventListener('message', moveHandler);
                    resolve({
                        from: bestMove[1].slice(0, 2),
                        to: bestMove[1].slice(2, 4),
                        promotion: bestMove[1].length > 4 ? bestMove[1][4] : undefined
                    });
                }
            };

            this.engine.addEventListener('message', moveHandler);
            this.engine.postMessage(`position fen ${position}`);
            this.engine.postMessage(`go depth ${this.depth}`);
        });
    }

    setDepth(depth) {
        this.depth = depth;
    }

    destroy() {
        if (this.engine) {
            this.engine.terminate();
            this.engine = null;
        }
    }
}