export const config = {
    // Пути к ресурсам
    stockfishPath: './js/stockfish/stockfish.js',
    
    // Таймауты
    moveTimeout: 30000,
    aiThinkingTime: 1000,

    // Настройки UI
    defaultDepth: 15,
    maxDepth: 20,
    minDepth: 1,
    
    // Настройки хранения
    maxStoredGames: 10,
    
    // Настройки доски
    boardConfig: {
        draggable: true,
        position: 'start',
        showNotation: true,
        orientation: 'white'
    }
};