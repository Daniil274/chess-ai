export class BaseAI {
    constructor(color, name) {
        this.color = color;
        this.name = name;
    }

    async initialize() {
        // Базовая инициализация
    }

    async getMove(position) {
        throw new Error('Must be implemented by subclass');
    }

    destroy() {
        // Базовая очистка ресурсов
    }

    setDepth(depth) {
        // Опциональный метод для установки глубины расчета
    }
}