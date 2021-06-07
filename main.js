const DIRECTIONS = [new Point(-1, 0), new Point(0, 1), new Point(1, 0), new Point(0, -1)];
const terminal = document.getElementById("terminal");
let dots = [];
let program = {};
let warps = {};

function Point(row, col) {
    this.row = row;
    this.col = col;

    this.add = function(dir) {
        let row = this.row + dir.row;
        let col = this.col + dir.col;
        return new Point(row, col);
    }

    this.opposite = () => {
        return new Point(-this.row+1-1, -this.col+1-1);
    }

    this.equals = (P) => {
        return this.row === P.row && this.col === P.col;
    }

    this.sub = (P) => {
        return this.add(P.opposite());
    }

    this.scale = (i) => {
        return new Point(this.row * i, this.col * i);
    }
}

function Warp(identifier, endpoints) {
    this.identifier = identifier;
    this.endpoints = endpoints;
}

function inString(pos, size) {
    let leftDouble = 0, rightDouble = 0, upDouble = 0, downDouble = 0;
    let leftSingle = 0, rightSingle = 0, upSingle = 0, downSingle = 0;
    for (let i = 0; i < size; i++) {
        let left = pos.add(DIRECTIONS[3].scale(i));
        let right = pos.add(DIRECTIONS[1].scale(i));
        let up = pos.add(DIRECTIONS[0].scale(i));
        let down = pos.add(DIRECTIONS[2].scale(i));

        switch (program.get(left)) {
            case "\"":
                leftDouble++;
                break;
            case "'":
                leftSingle++;
                break;
        }
        switch (program.get(right)) {
            case "\"":
                rightDouble++;
                break;
            case "'":
                rightSingle++;
                break;
        }
        switch (program.get(up)) {
            case "\"":
                upDouble++;
                break;
            case "'":
                upSingle++;
                break;
        }
        switch (program.get(down)) {
            case "\"":
                downDouble++;
                break;
            case "'":
                downSingle++;
                break;
        }
    }
    if (leftDouble % 2 === 1 && rightDouble % 2 === 1) {
        return true;
    }
    if (leftSingle % 2 === 1 && rightSingle % 2 === 1) {
        return true;
    }
    if (upDouble % 2 === 1 && downDouble % 2 === 1) {
        return true;
    }
    if (upSingle % 2 === 1 && downSingle % 2 === 1) {
        return true;
    }
    return false;
}

function findEndpoints(identifier, identifierPos) {
    let endpoints = [];
    for (let row = 0; row < program.size; row++) {
        for (let col = 0; col < program.size; col++) {
            let pos = new Point(row, col);
            if (program.get(pos) === identifier && !pos.equals(identifierPos)) {
                if (!inString(pos, program.size)) {
                    endpoints.push(pos);
                }
            }
        }
    }
    return endpoints;
}

function loadProgram(input) {
    let rows = input.split('\n');
    let longestRow = rows.length;
    rows.forEach(row => {
        if (longestRow < row.length) {
            longestRow = row.length;
        }
    });

    let grid = [];
    for (let i = 0; i < longestRow; i++) {
        if (typeof rows[i] !== 'undefined') {
            grid.push(rows[i].padEnd(longestRow, " ").split(""));
        } else {
            grid.push("".padEnd(longestRow, " ").split(""));
        }
    }

    program.grid = grid;
    // Create 2d undefined grid
    program.data = [...Array(longestRow)].map(e => Array(longestRow));
    program.size = longestRow;
    program.loaded = true;
    program.get = function(pos) {
        if (0 <= pos.row && pos.row < program.size && 
            0 <= pos.col && pos.col < program.size) {
                return program.grid[pos.row][pos.col];
        }
        return -1;
    }
    // Search for warps
    for (let i = 0; i < program.size; i++) {
        if (typeof rows[i] !== 'undefined') {
            if (rows[i].startsWith("%$")) {
                let col = 2; // Starting at 2, because %$ is two characters
                let pos = new Point(i, col);
                while (col < program.size && program.get(pos).match(/[a-zA-Z]/) !== null) {
                    let identifier = program.get(pos);
                    let endpoints = findEndpoints(identifier, pos);
                    if (endpoints.length >= 2) {
                        // Valid warp found
                        warps[identifier] = endpoints;
                    }
                    pos = new Point(i, ++col);
                }
            }
        }
    }
    console.log(warps);
    program.getData = (pos) => {
        if (0 <= pos.row && pos.row < program.size && 
            0 <= pos.col && pos.col < program.size) {
                return program.data[pos.row][pos.col];
        }
        return undefined;
    }
    program.setData = (pos, value) => {
        if (0 <= pos.row && pos.row < program.size && 
            0 <= pos.col && pos.col < program.size) {
                program.data[pos.row][pos.col] = value;
        }
    }
    program.resetData = (pos) => {
        if (0 <= pos.row && pos.row < program.size && 
            0 <= pos.col && pos.col < program.size) {
                program.data[pos.row][pos.col] = undefined;
        }
    }
}

function highlightChar(pos) {
    let cell = document.getElementById(`${pos.row}x${pos.col}`);
    if (cell !== null) {
        cell.style.backgroundColor = "red";
    }
}

function resetChar(pos) {
    let cell = document.getElementById(`${pos.row}x${pos.col}`);
    if (cell !== null) {
        cell.style.backgroundColor = "transparent";
    }
}

function readNumInDir(start, dir) {
    let curr = start;
    let num = 0;
    let asciiMode = false;
    if (program.get(curr) === "a") {
        asciiMode = true;
        curr = curr.add(dir);
    }
    if (program.get(curr) === "?") {
        let input = prompt("Please input a value:");
        if (input === "") {
            input = "0";
        }
        if (asciiMode) {
            return {
                number: input.charCodeAt(0),
                end: curr.add(dir)
            }
        }
        return {
            number: parseInt(input),
            end: curr.add(dir)
        }
    }
    while (!isNaN(program.get(curr)) && program.get(curr) !== -1) {
        num *= 10;
        num += parseInt(program.get(curr));
        curr = curr.add(dir);
    }
    return {
        number: num,
        end: curr
    };
}

// TODO: handle escape characters better
function readStrInDir(start, dir) {
    let curr = start;
    let str = "";
    let wrapper = null;
    let wrappersSeen = 0;
    while (wrappersSeen !== 2) {
        let char = program.get(curr);
        if (wrapper === null && (char === "\"" || char === "'")) {
            wrapper = char;
        }
        if (char === -1) {
            return {
                string: "Error printing!",
                end: curr
            };;
        } else if (char === wrapper && program.get(curr.sub(dir)) !== "\\") {
            wrappersSeen += 1;
        } else if (wrappersSeen === 1) {
            str += program.get(curr);
        }

        curr = curr.add(dir);
    }
    return {
        string: str,
        end: curr
    };
}

function handleOutput(dot) {
    let newline = "\n";
    let asciiMode = false;
    let nextChar = program.get(dot.next(1));
    switch (nextChar) {
        case "_":
            newline = "";
            break;
        case "a":
            asciiMode = true;
            nextChar = program.get(dot.next(2));
        case "#": {
            let output = dot.value.toString();
            if (asciiMode) {
                output = String.fromCharCode(dot.value);
            }
            terminal.value += output + newline;
            dot.nextPos = dot.next(3);
        } return;
        case "@": {
            let output = dot.id.toString();
            if (asciiMode) {
                output = String.fromCharCode(dot.id);
            }
            terminal.value += output + newline;
            dot.nextPos = dot.next(3);
        } return;
    }
    let {string, end} = readStrInDir(dot.pos, dot.dir);
    terminal.value += string + newline;
    dot.nextPos = end;
}

function handleOperation (dot, char) {
    let depositedData = program.getData(dot.pos);
    if (depositedData === undefined) {
        dot.stall();
    } else {
        dot.unstall();
        let oldValue = dot.value;
        if (dot.idOperation) {
            oldValue = dot.id;
        } 
        let updatedValue = 0;
        switch (char) {
            case '*':
                updatedValue = oldValue * depositedData;
                break;
            case '/':
                updatedValue = oldValue / depositedData;
                break;
            case '+':
                updatedValue = oldValue + depositedData;
                break;
            case '-':
                updatedValue = oldValue - depositedData;
                break;
            case '%':
                updatedValue = oldValue % depositedData;
                break;
            case '^':
                updatedValue = oldValue ** depositedData;
                break;
            case '&':
                if (oldValue !== 0 && depositedData !== 0) {
                    updatedValue = 1;
                } else {
                    updatedValue = 0;
                }
                break;
            case 'o':
                if (oldValue !== 0 || depositedData !== 0) {
                    updatedValue = 1;
                } else {
                    updatedValue = 0;
                }
                break;
            case 'x':
                if ((oldValue !== 0 && depositedData === 0) ||
                    (oldValue === 0 && depositedData !== 0)) {
                        updatedValue = 1;
                } else {
                    updatedValue = 0;
                }
                break;
            case '>':
                updatedValue = (oldValue > depositedData) ? 1 : 0;
                break;
            case 'G':
                updatedValue = (oldValue >= depositedData) ? 1 : 0;
                break;
            case '<':
                updatedValue = (oldValue < depositedData) ? 1 : 0;
                break;
            case 'L':
                updatedValue = (oldValue <= depositedData) ? 1 : 0;
                break;
            case '=':
                updatedValue = (oldValue === depositedData) ? 1 : 0;
                break;
            case '!':
                updatedValue = (oldValue !== depositedData) ? 1 : 0;
                break;
        }
        if (dot.idOperation === true) {
            dot.idOperation = false;
            dot.id = updatedValue;
        } else {
            dot.value = updatedValue;
        }
        program.resetData(dot.pos);
    }
}

function Dot(initPos, initDir, initID, initValue) {
    this.id = initID;
    this.value = initValue;
    this.pos = initPos;
    this.nextPos = initPos;
    this.dir = initDir;
    this.alive = true;
    this.idOperation = false;

    this.next = (i = 1) => {
        return this.pos.add(this.dir.scale(i));
    }

    this.isHorizontal = () => {
        return this.dir.row === 0 && this.dir.col !== 0;
    }

    this.isVertical = () => {
        return this.dir.row !== 0 && this.dir.col === 0;
    }

    this.isStalled = () => {
        return this.dir.row === 0 && this.dir.col === 0;
    }

    this.stall = () => {
        if (!this.isStalled()) {
            this.savedDir = this.dir;
            this.dir = new Point(0, 0);
        }
    }

    this.unstall = () => {
        if (this.isStalled()) {
            this.dir = this.savedDir;
            this.savedDir = undefined;
        }
    }

    this.step = function() {
        resetChar(this.pos);
        this.pos = this.nextPos;

        if (program.get(this.pos) === -1) {
            this.alive = false;
            return;
        }

        highlightChar(this.pos);

        let char = program.get(this.pos);
        // leftChar used to identify when in an operation
        let leftChar = program.get(this.pos.add(DIRECTIONS[3]));
        switch (leftChar) {
            case '{':
                if (this.isVertical()) {
                    program.setData(this.pos, this.value);
                    this.alive = false;
                    resetChar(this.pos);
                    return;
                } 
                handleOperation(this, char);
                this.nextPos = this.nextPos.add(this.dir);
                return;
            case '[':
                if (this.isHorizontal()) {
                    program.setData(this.pos, this.value);
                    this.alive = false;
                    resetChar(this.pos);
                    return;
                } 
                handleOperation(this, char);
                this.nextPos = this.nextPos.add(this.dir);
                return;
        }
        // Warp cases
        for (const [identifier, endpoints] of Object.entries(warps)) {
            if (char === identifier) {
                for (let endpoint of endpoints) {
                    if (!this.pos.equals(endpoint)) {
                        this.nextPos = endpoint.add(this.dir);
                        return;
                    }
                }
            }
        }
        // Changing direction cases
        switch (char) {
            case " ":
                this.alive = false;
                break;
            case '-':
                if (this.isVertical()) {
                    this.alive = false;
                }
                break;
            case '|':
                if (this.isHorizontal()) {
                    this.alive = false;
                }
                break;
            case ':': {
                let value = this.value;
                if (this.idOperation === true) {
                    this.idOperation = false;
                    value = this.id;
                }
                if (value === 0) {
                    this.alive = false;
                }
            } break;
            case ';': {
                let value = this.value;
                if (this.idOperation === true) {
                    this.idOperation = false;
                    value = this.id;
                }
                if (value === 1) {
                    this.alive = false;
                }
            } break;
            case '&':
                this.alive = false;
                break;
            case '\\':
                if (this.dir == DIRECTIONS[0]) {
                    this.dir = DIRECTIONS[3];
                } else if (this.dir == DIRECTIONS[1]) {
                    this.dir = DIRECTIONS[2];
                } else if (this.dir == DIRECTIONS[2]) {
                    this.dir = DIRECTIONS[1];
                } else if (this.dir == DIRECTIONS[3]) {
                    this.dir = DIRECTIONS[0];
                }
                break;
            case '/':
                if (this.dir == DIRECTIONS[0]) {
                    this.dir = DIRECTIONS[1];
                } else if (this.dir == DIRECTIONS[1]) {
                    this.dir = DIRECTIONS[0];
                } else if (this.dir == DIRECTIONS[2]) {
                    this.dir = DIRECTIONS[3];
                } else if (this.dir == DIRECTIONS[3]) {
                    this.dir = DIRECTIONS[2];
                }
                break;
            case '>':
                if (this.dir != DIRECTIONS[3]) {
                    this.dir = DIRECTIONS[1];
                }
                break;
            case '<':
                if (this.dir != DIRECTIONS[1]) {
                    this.dir = DIRECTIONS[3];
                }
                break;
            case '^':
                if (this.dir != DIRECTIONS[2]) {
                    this.dir = DIRECTIONS[0];
                }
                break;
            case 'v':
                if (this.dir != DIRECTIONS[0]) {
                    this.dir = DIRECTIONS[2];
                }
                break;
            case '(':
                if (this.dir == DIRECTIONS[3]) {
                    this.dir = DIRECTIONS[1];
                }
                break;
            case ')':
                if (this.dir == DIRECTIONS[1]) {
                    this.dir = DIRECTIONS[3];
                }
                break;
            case '*':
                for (let i = 0; i < 4; i++) {
                        if (program.get(this.pos.add(DIRECTIONS[i])) !== ' ' &&
                        !DIRECTIONS[i].equals(this.dir) &&
                        !DIRECTIONS[i].equals(this.dir.opposite())) {
                            dots.push(new Dot(this.pos, DIRECTIONS[i], this.id, this.value));
                    }
                }
                break;
            case '!':
                if (this.value === 0) {
                    this.value = 1;
                } else {
                    this.value = 0;
                }
                break;
            case '~':
                if (this.dir === DIRECTIONS[1] || 
                    this.dir === DIRECTIONS[3] ||
                    (this.dir.row === 0 && this.dir.col === 0)) {
                    // Horizontal case
                    if (program.getData(this.pos) === undefined) {
                        // Dot from bottom hasn't arrived yet
                        if (!(this.dir.row === 0 && this.dir.col === 0)) {
                            // Stall dot if it isn't already being stalled
                            this.savedDir = this.dir;
                            this.dir = new Point(0, 0);
                        }
                    } else if (program.getData(this.pos) !== 0) {
                        this.dir = DIRECTIONS[0];
                        this.savedDir = undefined;
                        program.resetData(this.pos);
                    } else if (program.getData(this.pos) === 0) {
                        if (this.savedDir !== undefined) {
                            this.dir = this.savedDir;
                            this.savedDir = undefined;
                        }
                        program.resetData(this.pos);
                    }
                } else if (this.dir === DIRECTIONS[0]){
                    // Coming from the bottom case
                    program.setData(this.pos, this.value);
                    this.alive = false;
                }
                break;
        }
        this.nextPos = this.next(1);
        // Teleporting cases
        switch (char) {
            case '#': {
                let {number, end} = readNumInDir(this.next(1), this.dir);
                this.value = number;
                this.nextPos = end;
            } break;
            case '@': {
                let nextChar = program.get(this.next(1));
                if (this.isHorizontal()) {
                    if (nextChar === '{') {
                        this.idOperation = true;
                        break;
                    } else if (nextChar === '[') {
                        this.value = this.id;
                        break;
                    } else if (nextChar === ':' || nextChar === ';') {
                        this.idOperation = true;
                        break;
                    }
                } else if (this.isVertical()) {
                    let upperLeftChar = program.get(this.next(1).add(DIRECTIONS[3]));
                    if (upperLeftChar === '{') {
                        this.value = this.id;
                        break;
                    } else if (upperLeftChar === '[') {
                        this.idOperation = true;
                        break;
                    } else if (nextChar === ':' || nextChar === ';') {
                        this.idOperation = true;
                        break;
                    }
                }
                let {number, end} = readNumInDir(this.next(1), this.dir);
                this.id = number;
                this.nextPos = end;
            } break;
            case '$':
                handleOutput(this);
                break;
            default:
                break;
        }

        if (!this.alive) {
            resetChar(this.pos);
        }
    }

}

function populateDots() {
    for (let row = 0; row < program.size; row++) {
        for (let col = 0; col < program.size; col++) {
            let pos = new Point(row, col);
            let symbol = program.get(pos);

            if (symbol == "." || symbol == "•") {
                for (let i = 0; i < 4; i++) {
                    let dir = DIRECTIONS[i];
                    let charInDir = program.get(pos.add(dir));
                    if ((dir.row != 0 && charInDir == "|") || 
                        (dir.col != 0 && charInDir == "-")) {
                        dots.push(new Dot(pos, dir, 0, 0));
                        break;
                    }
                }
            }
        }
    }
}

function setupTable() {
    let table = document.getElementById('visulization');
    // Clear table first
    table.innerHTML = "";

    for (let row = 0; row < program.size; row++) {
        let newRow = table.insertRow(row);
        for (let col = 0; col < program.size; col++) {
            let cell = newRow.insertCell(col);
            cell.id = `${row}x${col}`;
            cell.innerHTML = program.get(new Point(row, col));
        }
    }

}

function setup() {
    terminal.value = "===STARTING===\n";
    dots = [];
    program = {};
    let input = document.getElementById('code-input').value;
    loadProgram(input);
    populateDots();
    setupTable();
}

function run() {
    if (program.loaded !== true) {
        setup();
    }

    let loop = setInterval(() => {
        step();

        if (dots.length === 0) {
            clearInterval(loop);
        }
    }, 500);
}

function step() {
    if (program.loaded !== true) {
        setup();
    }

    dots.forEach(dot => {
        dot.step();
    });

    dots = dots.filter(dot => dot.alive);

    // Rerun stalled dots incase an updated would unstall them
    stalleDots = dots.filter(dot => dot.isStalled());
    stalleDots.forEach(dot => {
        dot.step();
    });

    if (dots.length === 0) {
        terminal.value += "\n===STOPPED===\n";
        program.loaded = false;
    }

    console.log(dots);
}