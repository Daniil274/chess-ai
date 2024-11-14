import { EventEmitter } from '../ui/EventEmitter.js';

export class SidebarUI extends EventEmitter {
    constructor() {
        super();
        this.sidebar = document.getElementById('sidebar');
        this.elements = {};
        this.isInitialized = false;
    }

    initialize(playerSettings = null) {
        if (this.isInitialized) return;
        
        this.initializeElements();
        this.initializeEventListeners();
        this.restoreState();
        
        if (playerSettings) {
            this.applyPlayerSettings(playerSettings);
        }

        this.isInitialized = true;
    }

    initializeElements() {
        this.elements = {
            whiteSelect: document.getElementById('whitePlayer'),
            blackSelect: document.getElementById('blackPlayer'),
            depthControl: document.getElementById('engineDepth'),
            depthValue: document.getElementById('depthValue'),
            depthSettings: document.getElementById('depthSettings'),
            matchHistory: document.querySelector('#sidebar .list-group'),
            openButton: document.getElementById('openSidebarBtn'),
            closeButton: document.getElementById('closeSidebarBtn')
        };
    }

    updatePlayerDisplay(color, player) {
        // Обновляем селект
        const select = this.elements[`${color}Select`];
        if (select) {
            const playerType = this.getPlayerTypeFromInstance(player);
            select.value = playerType;
        }

        // Обновляем отображение глубины для Stockfish
        if (player.constructor.name.toLowerCase().includes('stockfish')) {
            this.updateDepthVisibility(true);
            if (player.depth) {
                this.updateDepthValue(player.depth);
            }
        }
    }

    getPlayerTypeFromInstance(player) {
        if (!player) return 'human';
        
        const name = player.constructor.name.toLowerCase();
        if (name.includes('stockfish')) return 'stockfish';
        if (name.includes('human')) return 'human';
        return 'human'; // значение по умолчанию
    }

    // Метод для обновления состояния кнопки старт/пауза
    updatePlayButton(isPlaying) {
        const playButton = document.getElementById('playPauseBtn');
        if (playButton) {
            playButton.textContent = isPlaying ? 'Пауза' : 'Старт';
            playButton.classList.toggle('btn-primary', !isPlaying);
            playButton.classList.toggle('btn-warning', isPlaying);
        }
    }

    // Добавляем новый метод для обновления значения глубины
    updateDepthValue(depth) {
        if (this.elements.depthControl && this.elements.depthValue) {
            this.elements.depthControl.value = depth;
            this.elements.depthValue.textContent = depth;
            
            // Вызываем событие изменения глубины
            this.emit('depthChange', parseInt(depth));
        }
    }

    // Добавляем метод для получения текущего значения глубины
    getDepthValue() {
        return this.elements.depthControl ? 
            parseInt(this.elements.depthControl.value) : 
            15; // значение по умолчанию
    }

    initializeEventListeners() {
        // Обработчики для кнопок сайдбара
        this.elements.openButton?.addEventListener('click', () => this.toggle());
        this.elements.closeButton?.addEventListener('click', () => this.toggle());

        // Обработчики для селектов игроков
        this.elements.whiteSelect?.addEventListener('change', (e) => {
            this.emit('playerChange', { 
                color: 'white', 
                type: e.target.value 
            });
        });

        this.elements.blackSelect?.addEventListener('change', (e) => {
            this.emit('playerChange', { 
                color: 'black', 
                type: e.target.value 
            });
        });

        // Обработчик для глубины поиска
        this.elements.depthControl?.addEventListener('input', (e) => {
            const depth = parseInt(e.target.value);
            this.updateDepthValue(depth);
        });
    }

    applyPlayerSettings(settings) {
        if (!settings) return;

        // Устанавливаем типы игроков
        if (settings.white) {
            this.setPlayerType('white', settings.white.type);
            if (settings.white.depth) {
                this.updateDepthValue(settings.white.depth);
            }
        }
        if (settings.black) {
            this.setPlayerType('black', settings.black.type);
            if (settings.black.depth && !settings.white.depth) {
                this.updateDepthValue(settings.black.depth);
            }
        }
    }

    setPlayerType(color, type) {
        const select = this.elements[`${color}Select`];
        if (select && type) {
            select.value = type;
        }
    }

    updateDepthVisibility(show) {
        if (this.elements.depthSettings) {
            this.elements.depthSettings.style.display = show ? 'block' : 'none';
        }
    }

    toggle() {
        if (!this.sidebar) return;
        
        this.sidebar.classList.toggle('open');
        
        const isOpen = this.sidebar.classList.contains('open');
        if (this.elements.openButton) {
            this.elements.openButton.style.display = isOpen ? "none" : "block";
        }
        
        localStorage.setItem('sidebarOpen', isOpen);
    }

    restoreState() {
        const wasOpen = localStorage.getItem('sidebarOpen') === 'true';
        if (wasOpen) {
            this.toggle();
        }
    }

    updateMatchHistory(matches) {
        if (!this.elements.matchHistory) return;

        this.elements.matchHistory.innerHTML = matches.map(match => `
            <li class="list-group-item bg-dark text-white">
                <div>${match.opening || 'Неизвестный дебют'}</div>
                <small>${match.whitePlayer} vs ${match.blackPlayer}</small>
                <br>
                <small>${new Date(match.startTime).toLocaleDateString()}</small>
                <div class="text-right">${match.result}</div>
            </li>
        `).join('');
    }
}