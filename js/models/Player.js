export class HumanPlayer {
    constructor(color) {
        this.color = color;
        this.name = 'Человек';
        this.moveResolver = null;
    }

    async getMove(position) {
        return new Promise((resolve) => {
            this.moveResolver = resolve;
        });
    }

    makeMove(move) {
        if (this.moveResolver) {
            this.moveResolver(move);
            this.moveResolver = null;
        }
    }

    destroy() {
        this.moveResolver = null;
    }
}