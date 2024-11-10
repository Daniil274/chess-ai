class ChessMatch {
    constructor(whitePlayer, blackPlayer) {
        this.whitePlayer = whitePlayer;
        this.blackPlayer = blackPlayer;
        this.moves = [];
        this.startTime = new Date();
        this.endTime = null;
        this.result = null;
        this.opening = "Дебют определяется...";
    }

    addMove(move) {
        this.moves.push(move);
    }

    setResult(result) {
        this.result = result;
        this.endTime = new Date();
    }

    setOpening(opening) {
        this.opening = opening;
    }

    toJSON() {
        return {
            whitePlayer: this.whitePlayer,
            blackPlayer: this.blackPlayer,
            moves: this.moves,
            startTime: this.startTime,
            endTime: this.endTime,
            result: this.result,
            opening: this.opening
        };
    }
}