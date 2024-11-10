import { config } from './config/config.js';
import { GameState } from './services/GameState.js';
import { StorageService } from './services/StorageService.js';
import { OpeningBook } from './services/OpeningBook.js';
import { BoardUI } from './ui/BoardUI.js';
import { HistoryUI } from './ui/HistoryUI.js';
import { SidebarUI } from './ui/SidebarUI.js';
import { AIFactory } from './ai/AIFactory.js';
import { HumanPlayer } from './models/Player.js';
import { StockfishAI } from './ai/StockfishAI.js';


class ChessApplication {
    constructor() {
        this.storage = new StorageService();
        this.gameState = new GameState();
        this.openingBook = new OpeningBook();
        
        this.boardUI = new BoardUI('chessboard', config.boardConfig);
        this.historyUI = new HistoryUI('history');
        this.sidebarUI = new SidebarUI();

        this.whitePlayer = null;
        this.blackPlayer = null;
        this.isAutoPlaying = false;
    }

    initializeControls() {
        // Кнопки управления игрой
        document.getElementById('restartBtn')?.addEventListener('click', () => this.restartGame());
        document.getElementById('flipBoardBtn')?.addEventListener('click', () => this.flipBoard());
        document.getElementById('playPauseBtn')?.addEventListener('click', () => this.toggleAutoPlay());
    }

    async initialize() {
        try {
            await this.openingBook.initialize();
            
            this.boardUI.initialize();
            this.historyUI.initialize();
            
            // Устанавливаем callback для ходов
            this.boardUI.setMoveCallback((move) => {
                this.handleMove(move);
            });
            
            const savedGame = this.loadSavedGame();
            if (!savedGame) {
                this.setupNewGame();
            }
            
            this.bindEvents();
            this.initializeControls(); // Добавляем инициализацию контролов
        } catch (error) {
            console.error('Initialization error:', error);
        }
    }


    restartGame() {
        this.gameState.reset();
        this.boardUI.setPosition('start');
        this.historyUI.clear();
        this.saveCurrentGame();
    }
    
    flipBoard() {
        this.boardUI.flip();
    }

    toggleAutoPlay() {
        this.isAutoPlaying = !this.isAutoPlaying;
        const button = document.getElementById('playPauseBtn');
        if (button) {
            button.textContent = this.isAutoPlaying ? 'Пауза' : 'Старт';
            button.classList.toggle('btn-primary', !this.isAutoPlaying);
            button.classList.toggle('btn-warning', this.isAutoPlaying);
        }

        if (this.isAutoPlaying) {
            this.playNextMove();
        }
    }

    loadSavedGame() {
        const savedGame = this.storage.loadCurrentGame();
        if (!savedGame) return false;

        try {
            this.gameState.chess.load(savedGame.fen);
            this.boardUI.setPosition(savedGame.fen);
            
            // Восстанавливаем историю ходов
            if (savedGame.history) {
                savedGame.history.forEach(move => {
                    this.historyUI.addMove(move);
                });
            }

            // Восстанавливаем настройки игроков с значениями по умолчанию
            const whiteType = savedGame.whitePlayerType || 'human';
            const blackType = savedGame.blackPlayerType || 'stockfish';
            
            this.setPlayer('white', whiteType);
            this.setPlayer('black', blackType);

            return true;
        } catch (error) {
            console.error('Error loading saved game:', error);
            return false;
        }
    }


    saveCurrentGame() {
        const gameData = {
            fen: this.gameState.chess.fen(),
            history: this.gameState.moveHistory,
            whitePlayerType: this.whitePlayer?.constructor.name.toLowerCase(),
            blackPlayerType: this.blackPlayer?.constructor.name.toLowerCase(),
            timestamp: new Date().toISOString()
        };
        this.storage.saveCurrentGame(gameData);
    }

    handleMove(move) {
        const result = this.gameState.makeMove(move);
        if (result) {
            this.boardUI.setPosition(this.gameState.chess.fen());
            // Удаляем отсюда добавление хода в историю, так как оно происходит через событие
            this.saveCurrentGame();

            if (this.isAutoPlaying) {
                setTimeout(() => this.playNextMove(), config.aiThinkingTime);
            }
        }
    }

    bindEvents() {
        // Обработка событий от игровых компонентов
        this.gameState.on('move', (move) => {
            this.historyUI.addMove(move);
            this.saveCurrentGame();
        });

        this.gameState.on('gameOver', (status) => {
            this.handleGameOver(status);
        });

        // Обработка событий от UI
        this.sidebarUI.on('playerChange', ({ color, type }) => {
            this.setPlayer(color, type);
        });

        this.sidebarUI.on('depthChange', (depth) => {
            if (this.whitePlayer?.setDepth) this.whitePlayer.setDepth(depth);
            if (this.blackPlayer?.setDepth) this.blackPlayer.setDepth(depth);
        });
    }


    setupNewGame() {
        this.gameState = new GameState();
        this.boardUI.setPosition('start');
        this.historyUI.clear();
        
        // По умолчанию: человек за белых, Stockfish за черных
        this.setPlayer('white', 'human');
        this.setPlayer('black', 'stockfish');
    }

    handleGameOver(status) {
        let message = 'Игра окончена: ';
        if (status.isCheckmate) {
            message += `${status.turn === 'w' ? 'Черные' : 'Белые'} победили матом!`;
        } else if (status.isDraw) {
            message += 'Ничья!';
        }
        
        // Здесь можно добавить отображение модального окна или другого UI
        alert(message);
        
        // Сохраняем результат игры
        this.saveMatchResult(status);
    }

    saveMatchResult(status) {
        const matchData = {
            result: status.isCheckmate ? 
                (status.turn === 'w' ? '0-1' : '1-0') : 
                '1/2-1/2',
            whitePlayer: this.whitePlayer.name,
            blackPlayer: this.blackPlayer.name,
            moves: this.gameState.moveHistory,
            opening: this.openingBook.identifyOpening(this.gameState.chess.fen()),
            startTime: new Date().toISOString()
        };
        
        this.storage.saveMatch(matchData);
        this.sidebarUI.updateMatchHistory(this.storage.load('matches') || []);
    }

    setPlayer(color, type) {
        if (!type) {
            console.error('Player type is required');
            return;
        }
    
        try {
            const playerType = type.toLowerCase();
    
            // Останавливаем автоигру при смене игрока
            if (this.isAutoPlaying) {
                this.toggleAutoPlay();
            }
    
            // Уничтожаем текущего игрока если он существует
            if (color === 'white' && this.whitePlayer?.destroy) {
                this.whitePlayer.destroy();
            } else if (color === 'black' && this.blackPlayer?.destroy) {
                this.blackPlayer.destroy();
            }
    
            // Создаем нового игрока через фабрику
            const player = AIFactory.create(playerType, color);
    
            // Присваиваем игрока соответствующему цвету
            if (color === 'white') {
                this.whitePlayer = player;
            } else {
                this.blackPlayer = player;
            }
    
            // Обновляем select в сайдбаре
            const selectElement = color === 'white' ? 
                this.sidebarUI.whiteSelect : 
                this.sidebarUI.blackSelect;
            if (selectElement && selectElement.value !== playerType) {
                selectElement.value = playerType;
            }
    
            // Обновляем UI
            const playerElement = document.getElementById(`player${color.charAt(0).toUpperCase() + color.slice(1)}`);
            if (playerElement) {
                playerElement.textContent = `Игрок: ${player.name} (${color === 'white' ? 'Белые' : 'Черные'})`;
            }
    
            // Проверяем наличие Stockfish и обновляем видимость настроек глубины
            const hasStockfish = 
                (this.whitePlayer instanceof StockfishAI) ||
                (this.blackPlayer instanceof StockfishAI);
            
            this.sidebarUI.updateDepthVisibility(hasStockfish);
    
        } catch (error) {
            console.error(`Error setting player (${color}, ${type}):`, error);
        }
    }

    async playNextMove() {
        if (this.gameState.chess.game_over()) return;

        const currentPlayer = this.gameState.chess.turn() === 'w' 
            ? this.whitePlayer 
            : this.blackPlayer;

        if (!currentPlayer) return;

        try {
            const move = await currentPlayer.getMove(this.gameState.chess.fen());
            if (move) {
                this.handleMove(move);
            }
        } catch (error) {
            console.error('Error making move:', error);
            this.isAutoPlaying = false;
        }
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    const app = new ChessApplication();
    app.initialize().catch(error => {
        console.error('Application initialization failed:', error);
    });
});