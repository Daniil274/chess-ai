import { Chessboard } from '../ExternalLibs.js';

export class BoardUI {
    constructor(containerId, config) {
        this.container = document.getElementById(containerId);
        this.config = config;
        this.board = null;
        this.onMove = null; // Callback для хода
    }

    initialize() {
        const boardConfig = {
            ...this.config,
            draggable: true,
            onDragStart: this.handleDragStart.bind(this),
            onDrop: this.handleDrop.bind(this),
            onSnapEnd: this.handleSnapEnd.bind(this),
            position: 'start'
        };

        this.board = Chessboard(this.container.id, boardConfig);
        window.addEventListener('resize', () => this.board.resize());
    }

    handleDragStart(source, piece, position, orientation) {
        // Проверяем, что двигается фигура правильного цвета
        const currentTurn = piece.charAt(0); // 'w' или 'b'
        const isWhiteTurn = currentTurn === 'w';
        const isCorrectOrientation = (orientation === 'white' && isWhiteTurn) || 
                                    (orientation === 'black' && !isWhiteTurn);
        
        return isCorrectOrientation;
    }
    
    handleDrop(source, target) {
        // Проверяем валидность хода
        const move = {
            from: source,
            to: target,
            promotion: 'q'
        };
    
        // Если ход невозможен, возвращаем 'snapback'
        if (!this.isValidMove(source, target)) {
            return 'snapback';
        }
    
        if (this.onMove) {
            this.onMove(move);
        }
    }
    
    isValidMove(source, target) {
        // Базовые проверки
        if (source === target) return false;
        if (!source || !target) return false;
        
        // Дополнительные проверки можно добавить здесь
        return true;
    }

    setMoveCallback(callback) {
        this.onMove = callback;
    }

    handleSnapEnd(source, target, piece) {
        // Вызывается после завершения анимации хода
    }

    setPosition(fen) {
        if (this.board) {
            this.board.position(fen);
        }
    }

    flip() {
        if (this.board) {
            this.board.flip();
        }
    }

    // Метод для очистки доски
    clear() {
        if (this.board) {
            this.board.clear();
        }
    }

    // Метод для уничтожения доски
    destroy() {
        if (this.board) {
            this.board.destroy();
        }
    }
}