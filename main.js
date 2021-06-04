const DIRECTIONS = [new Point(-1, 0), new Point(0, 1), new Point(1, 0), new Point(0, -1)];
let dots = [];
let program = {};

function Point(row, col) {
    this.row = row;
    this.col = col;

    this.add = function(dir) {
        let row = this.row + dir.row;
        let col = this.col + dir.col;
        return new Point(row, col);
    }
}

function loadProgram(input) {
    let rows = input.split('\n');
    let longestRow = 0;
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
    program.size = longestRow;
    program.loaded = true;
    program.get = function(pos) {
        if (0 <= pos.row && pos.row <= program.size && 
            0 <= pos.col && pos.col <= program.size) {
                return program.grid[pos.row][pos.col];
        }
        return -1;
    }
}

function Dot(initPos, initDir, initID, initValue) {
    this.id = initID;
    this.value = initValue;
    this.pos = initPos;
    this.dir = initDir;

    this.step = function() {
        this.pos = this.pos.add(this.dir);
        console.log(program.get(this.pos));
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



function run() {
    dots = [];
    program = {};
    let input = document.getElementById('code-input').value;
    loadProgram(input);
    populateDots();
    
    dots.forEach(dot => {
        dot.step();
    });
}