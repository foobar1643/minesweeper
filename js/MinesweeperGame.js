function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

var CellChangedEvent = function(type, x, y, flagStatus) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.flagStatus = flagStatus;
}

var GameStateChangeEvent = function(type, gameState) {
    this.type = type;
    this.gameState = gameState;
}

var Game = function(sizeX, sizeY, fieldMines) {
    Object.assign(Game.prototype, EventDispatcher.prototype);
    this.gameState = Game.GAME_GOING;
    this.gameSizeX = sizeX;
    this.gameSizeY = sizeY;
    this.totalMines = fieldMines;
    this.openedCells = this.generateCells();
    this.flagedCells = [];
    this.mines = [];
    this.generateMines();
};

Game.GAME_GOING = "going";
Game.GAME_LOST = "lost";
Game.GAME_WON = "won";

Game.CELL_OPENED_EVENT = "cellOpened";
Game.CELL_FLAGED_EVENT = "cellFlagToggled";
Game.GAME_STATE_CHANGE_EVENT = "stateChange";
Game.GAME_RESTART_EVENT = "gameRestart";

var DOMview = function(model, table) {
    this.model = model;
    this.model.addEventListener(Game.CELL_OPENED_EVENT, this.cellOpenedEventHandler.bind(this));
    this.model.addEventListener(Game.CELL_FLAGED_EVENT, this.cellToggleEventHandler.bind(this));
    this.model.addEventListener(Game.GAME_STATE_CHANGE_EVENT, this.stateChangeEventHandler.bind(this));
    this.model.addEventListener(Game.GAME_RESTART_EVENT, this.gameRestartEventHandler.bind(this));
    this.gameTable = table;
    this.gameField = null;
    this.popupWindow = null;
};

var MouseController = function(model, view) {
    this.model = model;
    this.view = view;
    this.model.addEventListener(Game.GAME_RESTART_EVENT, this.gameRestartEventHandler.bind(this));
};

Game.prototype.resetGame = function() {
    this.gameState = Game.GAME_GOING;
    this.openedCells = this.generateCells();
    this.flagedCells = [];
    this.mines = [];
    this.generateMines();
    var restartEvent = new GameStateChangeEvent(Game.GAME_RESTART_EVENT);
    this.dispatchEvent(restartEvent);
}

Game.prototype.generateCells = function() {
    var cells = [];
    for(var y = 0; y < this.gameSizeY; y++) {
        cells[y] = [];
        for(var x = 0; x < this.gameSizeX; x++) {
            cells[y][x] = false;
        }
    }
    return cells;
}

Game.prototype.generateMines = function() {
    var mines = [];
    for(var i = 0; i < this.totalMines; i++) {
        var x = getRandomInt(0, this.gameSizeX - 1);
        var y = getRandomInt(0, this.gameSizeY - 1);
        if(!this.isMine(x, y)) {
            this.mines.push([y, x]);
        }
    }
}

Game.prototype.getMines = function() {
    return this.mines;
}

Game.prototype.getFlagedCells = function() {
    return this.flagedCells;
}

Game.prototype.getFlagsCount = function() {
    return this.flagedCells.length;
}

Game.prototype.getMinesCount = function() {
    return this.mines.length;
}

Game.prototype.isMine = function(x, y) {
    for(var i = 0; i < this.mines.length; i++) {
        if(this.mines.length > 0 && this.mines[i][0] == y && this.mines[i][1] == x) {
            return true;
        }
    }
    return false;
}

Game.prototype.isCellFlaged = function(x, y) {
    for(var i = 0; i < this.flagedCells.length; i++) {
        if(this.flagedCells[i][0] == x && this.flagedCells[i][1] == y) {
            return true;
        }
    }
    return false;
}

Game.prototype.isCellOpened = function(x, y) {
    if(this.openedCells[y][x] != false) {
        return true;
    }
    return false;
}

Game.prototype.getNeighborsMines = function(x, y) {
    var neighborsMines = 0;
    var neighbors = this.getNeighbors(x, y);
    for(var i = 0; i < neighbors.length; i++) {
        if(this.isMine(neighbors[i][1], neighbors[i][0])) {
            neighborsMines++;
        }
    }
    return neighborsMines;
}

Game.prototype.checkCellsWinCondition = function() {
    for(var y = 0; y < this.openedCells.length; y++) {
        for(var x = 0; x < this.openedCells[y].length; x++) {
            if(!this.isMine(x, y) && this.openedCells[y][x] == false) {
                return false;
            }
        }
    }
    return true;
}

Game.prototype.changeGameState = function(gameState) {
    if(this.gameState == Game.GAME_GOING) {
        this.gameState = gameState;
        var gameStateEvent = new GameStateChangeEvent(Game.GAME_STATE_CHANGE_EVENT, gameState);
        this.dispatchEvent(gameStateEvent);
    }
}

Game.prototype.openCell = function(x, y) {
    if(this.isCellOpened(x, y) || this.isCellFlaged(x, y)) {
        return false;
    } else {
        this.openedCells[y][x] = true;
        var mineClicked = this.isMine(x, y);
        var neighbors = this.getNeighbors(x, y);
        var neighborsMines = this.getNeighborsMines(x, y);
        var cellEvent = new CellChangedEvent(Game.CELL_OPENED_EVENT, x, y, null);
        this.dispatchEvent(cellEvent);
        if(neighborsMines == 0 && !mineClicked) { // open nearby cells if there is no mines
            for(var i = 0; i < neighbors.length; i++) {
                this.openCell(neighbors[i][1], neighbors[i][0]);
            }
        }
        if(mineClicked) {
            this.changeGameState(Game.GAME_LOST);
        }
        if(this.checkCellsWinCondition()) {
            this.changeGameState(Game.GAME_WON);
        }
    }
}

Game.prototype.flagCell = function(x, y) {
    var flagStatus = null;
    if(!this.isCellOpened(x, y) && !this.isCellFlaged(x, y)) {
        this.flagedCells.push([x, y]);
        flagStatus = "flaged";
    } else if(this.isCellFlaged(x, y)) {
        for(var i = 0; i < this.flagedCells.length; i++) { // refactor this ?
            if(this.flagedCells[i][0] == x && this.flagedCells[i][1] == y) {
                this.flagedCells.splice(i, 1);
            }
        }
        flagStatus = "unflaged";
    }
    var cellEvent = new CellChangedEvent(Game.CELL_FLAGED_EVENT, x, y, flagStatus);
    this.dispatchEvent(cellEvent);
}

Game.prototype.getNeighbors = function(x, y) {
    var neighbors = [];
    for(var ny = -1; ny < 2; ny++) {
        if(y + ny < this.gameSizeY && y + ny >= 0) {
            for(var nx = -1; nx < 2; nx++) {
                if(x + nx < this.gameSizeX && x + nx >= 0) {
                    if(y + ny != y || x + nx != x) neighbors.push([y + ny, x + nx]);
                }
            }
        }
    }
    return neighbors;
}

DOMview.prototype.findCell = function(x, y) {
    return this.gameField.rows[y].cells[x];
}

DOMview.prototype.cellOpenedEventHandler = function(e) {
    var cell = this.findCell(e.x, e.y);
    var minesNearby = this.model.getNeighborsMines(e.x, e.y);
    var mineClicked = this.model.isMine(e.x, e.y);
    if(mineClicked) {
        cell.classList.add("cell-explosion", "cell-bomb");
    } else {
        cell.classList.add("cell-opened");
    }
    if(minesNearby > 0 && !mineClicked) {
        cell.innerHTML = minesNearby;
    }
}

DOMview.prototype.setMinesCount = function(minesCount) {
    document.getElementById("mines-count").innerHTML = minesCount;
}

DOMview.prototype.cellToggleEventHandler = function(e) {
    var cell = this.findCell(e.x, e.y);
    if(e.flagStatus == "flaged") {
        cell.classList.add("cell-flag");
    } else {
        cell.classList.remove("cell-flag");
    }
    this.setMinesCount(this.model.getMinesCount() - this.model.getFlagsCount());
}

DOMview.prototype.gameRestartEventHandler = function(e) {
    if(this.popupWindow) {
        this.popupWindow.closeWindow();
    }
    var table = this.gameField.parentNode;
    table.className = "minesweeper";
    this.createField();
}

DOMview.prototype.showMines = function() {
    var mines = this.model.getMines();
    for(var i = 0; i < mines.length; i++) {
        var mine = mines[i];
        var cell = this.findCell(mine[1], mine[0]);
        if(!this.model.isCellFlaged(mine[1], mine[0])) {
            cell.classList.add("cell-bomb");
        }
    }
}

DOMview.prototype.showWrongFlags = function() {
    var flags = this.model.getFlagedCells();
    for(var i = 0; i < flags.length; i++) {
        var flaged = flags[i];
        var flagedCell = this.findCell(flaged[0], flaged[1]);
        if(!this.model.isMine(flaged[0], flaged[1])) {
            flagedCell.classList.add("cell-opened", "cell-wrong");
        }
    }
}

DOMview.prototype.stateChangeEventHandler = function(e) {
    var popupHeadline = "";
    var popupText = "";
    if(e.gameState == Game.GAME_LOST) {
        this.gameField.parentNode.className = "minesweeper-lost";
        this.showMines();
        this.showWrongFlags();
        popupHeadline = "You lost!";
        popupText = "Unfortunately, you lost. Try again?";
    } else {
        this.gameField.parentNode.className = "minesweeper-won";
        popupHeadline = "You won!";
        popupText = "Congratulations, you won. Try again?";
    }
    this.popupWindow = new Popup("game-popup", popupHeadline, popupText);
    var newGameButton = this.popupWindow.addControlButton("popup-new-game", "New Game");
    if(newGameButton) newGameButton.addEventListener("click", this.model.resetGame.bind(this.model));
    this.popupWindow.showWindow();
}

DOMview.prototype.createField = function() {
    if(this.gameField != null) {
        this.gameTable.removeChild(this.gameField);
    }
    this.gameField = document.createElement("tbody");
    for(var y = 0; y < this.model.gameSizeY; y++) {
        var tableRow = document.createElement("tr");
        for(var x = 0; x < this.model.gameSizeX; x++) {
            var tableColumn = document.createElement("td");
            tableRow.appendChild(tableColumn);
        }
        this.gameField.appendChild(tableRow);
    }
    this.setMinesCount(this.model.getMinesCount());
    this.gameTable.appendChild(this.gameField);
}

MouseController.prototype.addEventListeners = function() {
    this.view.gameField.addEventListener("mousedown", this.cellClickEventHandler.bind(this));
    this.view.gameField.addEventListener("contextmenu", function(e) { e.preventDefault(); });
}

MouseController.prototype.cellClickEventHandler = function(e) {
    var x = e.target.cellIndex;
    var y = e.target.parentNode.rowIndex - 1;
    if(this.model.gameState == Game.GAME_GOING && e.button == 0) {
        this.model.openCell(x, y);
    } else if(this.model.gameState == Game.GAME_GOING && e.button == 2) {
        this.model.flagCell(x, y);
    }
}

MouseController.prototype.gameRestartEventHandler = function(e) {
    this.addEventListeners();
}