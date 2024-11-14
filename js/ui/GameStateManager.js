export class GameStateManager {
    constructor(storage) {
        this.storage = storage;
        this.defaultState = {
            whitePlayerType: 'human',
            blackPlayerType: 'stockfish',
            engineDepth: 15,
            boardOrientation: 'white',
            currentFen: 'start',
            moveHistory: [],
            timestamp: new Date().toISOString()
        };
    }

    loadGameState() {
        try {
            const savedState = this.storage.load('currentGame');
            if (!savedState) return this.defaultState;

            return {
                ...this.defaultState,
                ...savedState
            };
        } catch (error) {
            console.error('Error loading game state:', error);
            return this.defaultState;
        }
    }

    saveGameState(state) {
        try {
            const stateToSave = {
                ...state,
                timestamp: new Date().toISOString()
            };
            this.storage.save('currentGame', stateToSave);
        } catch (error) {
            console.error('Error saving game state:', error);
        }
    }

    loadPlayerSettings() {
        try {
            return {
                white: this.storage.load('whitePlayerSettings') || {
                    type: 'human',
                    depth: 15
                },
                black: this.storage.load('blackPlayerSettings') || {
                    type: 'stockfish',
                    depth: 15
                }
            };
        } catch (error) {
            console.error('Error loading player settings:', error);
            return {
                white: { type: 'human', depth: 15 },
                black: { type: 'stockfish', depth: 15 }
            };
        }
    }

    savePlayerSettings(color, settings) {
        this.storage.save(`${color}PlayerSettings`, settings);
    }
}