import { EventEmitter } from '../ui/EventEmitter.js';


export class SidebarUI extends EventEmitter {
    constructor() {
        super();
        this.sidebar = document.getElementById('sidebar');
        this.initializeElements();
        this.initializeEventListeners();
        this.restoreState(); // Восстанавливаем состояние сайдбара
    }

    initializeElements() {
        this.whiteSelect = document.getElementById('whitePlayer');
        this.blackSelect = document.getElementById('blackPlayer');
        this.depthControl = document.getElementById('engineDepth');
        this.depthValue = document.getElementById('depthValue');
        this.matchHistory = document.querySelector('#sidebar .list-group');
        
        // Добавляем обработчики для кнопок сайдбара
        document.getElementById('openSidebarBtn')?.addEventListener('click', () => this.toggle());
        document.getElementById('closeSidebarBtn')?.addEventListener('click', () => this.toggle());
    }

    initializeEventListeners() {
        this.whiteSelect?.addEventListener('change', (e) => {
            const newType = e.target.value;
            this.emit('playerChange', { 
                color: 'white', 
                type: newType
            });
        });
    
        this.blackSelect?.addEventListener('change', (e) => {
            const newType = e.target.value;
            this.emit('playerChange', { 
                color: 'black', 
                type: newType
            });
        });

        // Обработчик для глубины поиска
        this.depthControl?.addEventListener('input', (e) => {
            if (this.depthValue) {
                this.depthValue.textContent = e.target.value;
            }
            this.emit('depthChange', parseInt(e.target.value));
        });
    }

    toggle() {
        if (!this.sidebar) return;
        
        this.sidebar.classList.toggle('open');
        
        const container = document.querySelector('.container');
        if (container) {
            container.classList.toggle('sidebar-open');
        }
        
        // Сохраняем состояние сайдбара
        const isOpen = this.sidebar.classList.contains('open');
        document.getElementById('openSidebarBtn').style.display = isOpen ? "none" : "block";
        localStorage.setItem('sidebarOpen', isOpen);
    }
    

    restoreState() {
        const wasOpen = localStorage.getItem('sidebarOpen') === 'true';
        if (wasOpen) {
            this.toggle();
        }
    }

    updateDepthVisibility(show) {
        const depthSettings = document.getElementById('depthSettings');
        if (depthSettings) {
            depthSettings.style.display = show ? 'block' : 'none';
        }
    }

    updateMatchHistory(matches) {
        if (!this.matchHistory) return;

        this.matchHistory.innerHTML = matches.map(match => `
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