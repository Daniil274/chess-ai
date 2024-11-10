export class HistoryUI {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.moveNumber = 1;
    }

    initialize() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <table class="table table-sm table-dark table-striped table-bordered">
                <thead class="thead-dark">
                    <tr>
                        <th scope="col" class="text-center">#</th>
                        <th scope="col" class="text-center">Белые</th>
                        <th scope="col" class="text-center">Черные</th>
                    </tr>
                </thead>
                <tbody id="moveHistory"></tbody>
            </table>
        `;
        this.tbody = this.container.querySelector('#moveHistory');
    }

    clear() {
        if (this.tbody) {
            this.tbody.innerHTML = '';
            this.moveNumber = 1;
        }
    }

    addMove(move) {
        if (move.color === 'w') {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.moveNumber}</td>
                <td>${move.san}</td>
                <td></td>
            `;
            this.tbody.appendChild(row);
        } else {
            const lastRow = this.tbody.lastElementChild;
            if (lastRow) {
                lastRow.cells[2].textContent = move.san;
                this.moveNumber++;
            }
        }
        this.scrollToBottom();
    }

    scrollToBottom() {
        this.container.scrollTop = this.container.scrollHeight;
    }
}