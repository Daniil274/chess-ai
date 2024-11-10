export class StorageService {
    constructor(prefix = 'chess_') {
        this.prefix = prefix;
    }

    save(key, data) {
        try {
            localStorage.setItem(
                this.prefix + key, 
                JSON.stringify(data)
            );
            return true;
        } catch (error) {
            console.error('Storage save error:', error);
            return false;
        }
    }

    load(key) {
        try {
            const data = localStorage.getItem(this.prefix + key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Storage load error:', error);
            return null;
        }
    }

    remove(key) {
        localStorage.removeItem(this.prefix + key);
    }

    saveMatch(match) {
        const matches = this.load('matches') || [];
        matches.unshift(match);
        this.save('matches', matches.slice(0, config.maxStoredGames));
    }

    loadCurrentGame() {
        return this.load('currentGame');
    }

    saveCurrentGame(gameState) {
        this.save('currentGame', gameState);
    }
}