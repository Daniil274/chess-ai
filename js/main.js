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
import { GameStateManager } from './ui/GameStateManager.js';

class ChessApplication {
    constructor() {
        this.storage = new StorageService();
        this.stateManager = new GameStateManager(this.storage);
        this.gameState = new GameState();
        this.openingBook = new OpeningBook();

        this.boardUI = new BoardUI('chessboard', config.boardConfig);
        this.historyUI = new HistoryUI('history');
        this.sidebarUI = new SidebarUI();

        this.whitePlayer = null;
        this.blackPlayer = null;
        this.isAutoPlaying = false;

        // Добавляем автосохранение при закрытии страницы
        window.addEventListener('beforeunload', () => {
            this.saveCurrentGameState();
        });
    }

    async initialize() {
        try {
            await this.openingBook.initialize();

            // Загружаем сохраненное состояние и настройки
            const savedState = this.stateManager.loadGameState();
            const playerSettings = this.stateManager.loadPlayerSettings();

            // Инициализируем компоненты
            this.boardUI.initialize(this.gameState.chess);
            this.historyUI.initialize();
            this.sidebarUI.initialize(playerSettings);

            // Устанавливаем callback для ходов
            this.boardUI.setMoveCallback((move) => this.handleMove(move));

            // Привязываем события
            this.bindEvents();

            // Восстанавливаем состояние игры
            if (savedState && savedState.currentFen !== 'start') {
                await this.restoreGameState(savedState);
            } else {
                this.setupNewGame();
            }

        } catch (error) {
            console.error('Initialization error:', error);
            this.setupNewGame();
        }
    }

    handleMove(move) {
        const result = this.gameState.makeMove(move);
        if (result) {
            // Обновляем позицию на доске
            this.boardUI.setPosition(this.gameState.getCurrentFen());
            
            // Добавляем ход в историю UI
            this.historyUI.addMove(result);
            
            // Сохраняем состояние после каждого хода
            this.saveCurrentGameState();

            // Проверяем окончание игры
            if (this.gameState.chess.game_over()) {
                this.handleGameOver({
                    isCheckmate: this.gameState.chess.in_checkmate(),
                    isDraw: this.gameState.chess.in_draw(),
                    turn: this.gameState.chess.turn()
                });
            } else if (this.isAutoPlaying) {
                setTimeout(() => this.playNextMove(), config.aiThinkingTime);
            }
        }
        return result;
    }

    async playNextMove() {
        if (!this.isAutoPlaying || this.gameState.chess.game_over()) {
            this.isAutoPlaying = false;
            this.sidebarUI.updatePlayButton(false);
            return;
        }

        const currentPlayer = this.gameState.chess.turn() === 'w' ? 
            this.whitePlayer : this.blackPlayer;

        if (!currentPlayer) return;

        try {
            const move = await currentPlayer.getMove(this.gameState.getCurrentFen());
            if (move) {
                this.handleMove(move);
            }
        } catch (error) {
            console.error('Error making move:', error);
            this.isAutoPlaying = false;
            this.sidebarUI.updatePlayButton(false);
        }
    }

    saveCurrentGameState() {
        const currentState = {
            whitePlayerType: this.whitePlayer?.constructor.name.toLowerCase(),
            blackPlayerType: this.blackPlayer?.constructor.name.toLowerCase(),
            engineDepth: this.getCurrentEngineDepth(),
            boardOrientation: this.boardUI.getOrientation(),
            currentFen: this.gameState.getCurrentFen(),
            moveHistory: this.gameState.getMoveHistory()
        };

        this.stateManager.saveGameState(currentState);
    }

    async restoreGameState(savedState) {
        try {
            // Загружаем позицию
            if (savedState.currentFen && savedState.currentFen !== 'start') {
                this.gameState.loadPosition(savedState.currentFen);
                this.boardUI.setPosition(savedState.currentFen);
            }

            // Восстанавливаем историю ходов
            if (savedState.moveHistory && savedState.moveHistory.length > 0) {
                savedState.moveHistory.forEach(move => {
                    this.historyUI.addMove(move);
                });
                this.gameState.restoreHistory(savedState.moveHistory);
            }

            // Устанавливаем игроков
            await this.setPlayer('white', savedState.whitePlayerType || 'human');
            await this.setPlayer('black', savedState.blackPlayerType || 'stockfish');

            // Устанавливаем глубину расчета
            if (savedState.engineDepth) {
                this.sidebarUI.updateDepthValue(savedState.engineDepth);
            }

            // Восстанавливаем ориентацию доски
            if (savedState.boardOrientation !== this.boardUI.getOrientation()) {
                this.boardUI.flip();
            }

            return true;
        } catch (error) {
            console.error('Error restoring game state:', error);
            return false;
        }
    }

    toggleAutoPlay() {
        this.isAutoPlaying = !this.isAutoPlaying;
        this.sidebarUI.updatePlayButton(this.isAutoPlaying);

        if (this.isAutoPlaying) {
            this.playNextMove();
        }
    }

    async playNextMove() {
        if (!this.isAutoPlaying || this.gameState.chess.game_over()) return;

        const currentPlayer = this.gameState.chess.turn() === 'w' ? 
            this.whitePlayer : this.blackPlayer;

        if (!currentPlayer) return;

        try {
            const move = await currentPlayer.getMove(this.gameState.getCurrentFen());
            if (move) {
                this.handleMove(move);
            }
        } catch (error) {
            console.error('Error making move:', error);
            this.isAutoPlaying = false;
        }
    }

    undoMove() {
        if (this.isAutoPlaying) {
            this.toggleAutoPlay();
        }

        const move = this.gameState.undo();
        if (move) {
            this.boardUI.setPosition(this.gameState.getCurrentFen());
            this.historyUI.removeLastMove();
            this.saveCurrentGameState();
        }
    }

    initializeComponents(savedState) {
        // Инициализируем UI компоненты
        this.boardUI.initialize(this.gameState.chess);
        this.historyUI.initialize();
        this.sidebarUI.initialize(this.stateManager.loadPlayerSettings());

        // Устанавливаем callback для ходов
        this.boardUI.setMoveCallback((move) => this.handleMove(move));
    }

    async initializeControls() {
        try {
            await this.openingBook.initialize();

            // Передаем ссылку на chess instance при инициализации BoardUI
            this.boardUI.initialize(this.gameState.chess);
            this.historyUI.initialize();
            // Кнопки управления игрой
            document.getElementById('restartBtn')?.addEventListener('click', () => this.restartGame());
            document.getElementById('flipBoardBtn')?.addEventListener('click', () => this.flipBoard());
            document.getElementById('playPauseBtn')?.addEventListener('click', () => this.toggleAutoPlay());
        } catch (error) {
            console.error('Initialization error:', error);
        }

    }

    

    saveCurrentGameState() {
        const currentState = {
            whitePlayerType: this.whitePlayer?.constructor.name.toLowerCase(),
            blackPlayerType: this.blackPlayer?.constructor.name.toLowerCase(),
            engineDepth: this.getCurrentEngineDepth(),
            boardOrientation: this.boardUI.getOrientation(),
            currentFen: this.gameState.getCurrentFen(),
            moveHistory: this.gameState.getMoveHistory(),
            timestamp: new Date().toISOString()
        };

        this.stateManager.saveGameState(currentState);
    }
    


    saveCurrentGameState() {
        const currentState = {
            whitePlayerType: this.whitePlayer?.constructor.name.toLowerCase(),
            blackPlayerType: this.blackPlayer?.constructor.name.toLowerCase(),
            engineDepth: this.getCurrentEngineDepth(),
            boardOrientation: this.boardUI.getOrientation(),
            currentFen: this.gameState.getCurrentFen(),
            moveHistory: this.gameState.getMoveHistory(),
            timestamp: new Date().toISOString()
        };

        this.stateManager.saveGameState(currentState);
    }

    getCurrentEngineDepth() {
        // Получаем текущую глубину из активного движка
        const stockfishPlayer = [this.whitePlayer, this.blackPlayer]
            .find(player => player?.constructor.name.toLowerCase().includes('stockfish'));
        
        return stockfishPlayer?.depth || config.defaultDepth;
    }

    restartGame() {
        this.gameState.reset();
        this.boardUI.setPosition('start');
        this.historyUI.clear();
        this.saveCurrentGame();
    }

    flipBoard() {
        this.boardUI.flip();
        this.saveCurrentGameState();
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


    bindEvents() {
        // Привязываем обработчики событий кнопок
        document.getElementById('playPauseBtn')?.addEventListener('click', () => this.toggleAutoPlay());
        document.getElementById('undoBtn')?.addEventListener('click', () => this.undoMove());
        document.getElementById('restartBtn')?.addEventListener('click', () => this.setupNewGame());
        document.getElementById('flipBoardBtn')?.addEventListener('click', () => this.flipBoard());

        // Привязываем обработчики изменения игроков
        this.sidebarUI.on('playerChange', (data) => {
            this.setPlayer(data.color, data.type);
        });

        // Привязываем обработчик изменения глубины
        this.sidebarUI.on('depthChange', (depth) => {
            this.updateEngineDepth(depth);
        });
    }

    updateEngineDepth(depth) {
        const stockfishPlayers = [this.whitePlayer, this.blackPlayer]
            .filter(player => player?.constructor.name.toLowerCase().includes('stockfish'));

        stockfishPlayers.forEach(player => {
            if (player?.setDepth) {
                player.setDepth(depth);
            }
        });

        // Сохраняем настройки глубины для обоих игроков
        ['white', 'black'].forEach(color => {
            const player = color === 'white' ? this.whitePlayer : this.blackPlayer;
            if (player?.constructor.name.toLowerCase().includes('stockfish')) {
                this.stateManager.savePlayerSettings(color, {
                    type: 'stockfish',
                    depth: depth
                });
            }
        });
    }

    setupNewGame() {
        try {
            // Останавливаем автоигру, если она запущена
            if (this.isAutoPlaying) {
                this.toggleAutoPlay();
            }

            // Сбрасываем состояние игры
            this.gameState.reset();
            
            // Очищаем историю ходов
            this.historyUI.clear();
            
            // Устанавливаем начальную позицию
            this.boardUI.setPosition('start');

            // Восстанавливаем настройки игроков из сохраненных
            const playerSettings = this.stateManager.loadPlayerSettings();
            
            // Устанавливаем игроков заново
            this.setPlayer('white', playerSettings.white.type || 'human');
            this.setPlayer('black', playerSettings.black.type || 'stockfish');

            // Устанавливаем ориентацию доски на белых
            if (this.boardUI.getOrientation() !== 'white') {
                this.boardUI.flip();
            }

            // Сохраняем начальное состояние
            this.saveCurrentGameState();

            // Обновляем UI
            if (this.sidebarUI) {
                this.sidebarUI.updateDepthVisibility(
                    playerSettings.white.type === 'stockfish' || 
                    playerSettings.black.type === 'stockfish'
                );
            }

        } catch (error) {
            console.error('Error setting up new game:', error);
            
            // В случае ошибки устанавливаем дефолтное состояние
            this.gameState.reset();
            this.boardUI.setPosition('start');
            this.historyUI.clear();
            this.setPlayer('white', 'human');
            this.setPlayer('black', 'stockfish');
        }
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
        if (!type) return;

        try {
            const playerType = type.toLowerCase();
            const currentPlayer = color === 'white' ? this.whitePlayer : this.blackPlayer;

            // Останавливаем автоигру при смене игрока
            if (this.isAutoPlaying) {
                this.toggleAutoPlay();
            }

            // Уничтожаем текущего игрока если он существует
            if (currentPlayer?.destroy) {
                currentPlayer.destroy();
            }

            // Создаем нового игрока через фабрику
            const player = AIFactory.create(playerType, color);

            // Восстанавливаем настройки игрока
            const settings = this.stateManager.loadPlayerSettings()[color];
            if (settings && player.setDepth) {
                player.setDepth(settings.depth);
            }

            // Присваиваем игрока
            if (color === 'white') {
                this.whitePlayer = player;
            } else {
                this.blackPlayer = player;
            }

            // Сохраняем настройки игрока
            this.stateManager.savePlayerSettings(color, {
                type: playerType,
                depth: player.depth || config.defaultDepth
            });

            // Обновляем UI
            this.sidebarUI.updatePlayerDisplay(color, player);
            this.updateEngineSettingsVisibility();

        } catch (error) {
            console.error(`Error setting player (${color}, ${type}):`, error);
        }
    }

    updateEngineSettingsVisibility() {
        const hasStockfish = 
            (this.whitePlayer instanceof StockfishAI) ||
            (this.blackPlayer instanceof StockfishAI);
        this.sidebarUI.updateDepthVisibility(hasStockfish);
    }

}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    const app = new ChessApplication();
    app.initialize().catch(error => {
        console.error('Application initialization failed:', error);
    });
});