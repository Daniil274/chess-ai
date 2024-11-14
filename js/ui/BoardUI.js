import { Chessboard } from '../ExternalLibs.js';

export class BoardUI {
    constructor(containerId, config) {
        this.container = document.getElementById(containerId);
        this.config = config;
        this.board = null;
        this.onMove = null;
        this.game = null;
        this.orientation = 'white'; // Добавляем отслеживание ориентации
    }

    initialize(gameInstance) {
        this.game = gameInstance;
        
        const boardConfig = {
            ...this.config,
            draggable: true,
            onDragStart: this.handleDragStart.bind(this),
            onDrop: this.handleDrop.bind(this),
            onSnapEnd: this.handleSnapEnd.bind(this),
            position: 'start',
            orientation: this.orientation
        };

        this.board = Chessboard(this.container.id, boardConfig);
        window.addEventListener('resize', () => this.board.resize());
    }

    handleDragStart(source, piece, position, orientation) {
        if (!this.game) return false;

        const currentTurn = piece.charAt(0);
        
        if (this.game.game_over() || 
            currentTurn !== this.game.turn()) {
            return false;
        }
        
        return true;
    }
    
    handleDrop(source, target) {
        if (!source || !target) return 'snapback';

        const move = {
            from: source,
            to: target,
            promotion: 'q'
        };
    
        if (!this.isValidMove(source, target)) {
            return 'snapback';
        }
    
        if (this.onMove) {
            this.onMove(move);
        }
    }
    
    isValidMove(source, target) {
        if (!this.game) return false;
        if (source === target) return false;
        if (!source || !target) return false;
        
        const move = {
            from: source,
            to: target,
            promotion: 'q'
        };
        
        const possibleMoves = this.game.moves({ verbose: true });
        return possibleMoves.some(m => 
            m.from === move.from && 
            m.to === move.to
        );
    }

    setMoveCallback(callback) {
        this.onMove = callback;
    }

    handleSnapEnd() {
        // Вызывается после завершения анимации хода
    }

    setPosition(fen) {
        if (this.board) {
            this.board.position(fen);
        }
    }

    // Добавляем метод получения текущей ориентации
    getOrientation() {
        return this.orientation;
    }

    // Обновляем метод flip
    flip() {
        if (this.board) {
            this.orientation = this.orientation === 'white' ? 'black' : 'white';
            this.board.flip();
        }
    }

    // Метод для установки ориентации
    setOrientation(orientation) {
        if (this.board && (orientation === 'white' || orientation === 'black')) {
            this.orientation = orientation;
            this.board.orientation(orientation);
        }
    }

    clear() {
        if (this.board) {
            this.board.clear();
        }
    }

    destroy() {
        if (this.board) {
            this.board.destroy();
            window.removeEventListener('resize', this.board.resize);
        }
    }

    // Метод для проверки готовности доски
    isReady() {
        return !!this.board;
    }

    // Метод для обновления конфигурации
    updateConfig(newConfig) {
        this.config = {
            ...this.config,
            ...newConfig
        };
        
        if (this.board) {
            this.board.destroy();
            this.initialize(this.game);
        }
    }
}