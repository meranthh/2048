// размер поля
const SIZE = 4;

let grid = [];          // поле 4x4, в клетке лежит плитка или null
let score = 0;
let nextId = 1;         // у каждой плитки свой id

let tileElements = {};  

const board = document.getElementById('board');


// поле 

function createCells() {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.style.setProperty('--row', r);
      cell.style.setProperty('--col', c);
      board.appendChild(cell);
    }
  }
}

function emptyGrid() {
  const g = [];
  for (let r = 0; r < SIZE; r++) {
    g.push([]);
    for (let c = 0; c < SIZE; c++) {
      g[r].push(null);
    }
  }
  return g;
}

function createTile(value, row, col) {
  return { id: nextId++, value: value, row: row, col: col };
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getEmptyCells() {
  const empty = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === null) {
        empty.push([r, c]);
      }
    }
  }
  return empty;
}

// новая плитка 2 или 4 в случайной пустой клетке
function addRandomTile() {
  const empty = getEmptyCells();
  if (empty.length === 0) {
    return null;
  }
  const place = empty[Math.floor(Math.random() * empty.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  const tile = createTile(value, place[0], place[1]);
  grid[place[0]][place[1]] = tile;
  return tile;
}

function getAllTiles() {
  const tiles = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c]) {
        tiles.push(grid[r][c]);
      }
    }
  }
  return tiles;
}


// отрисовка 

function setPosition(el, row, col) {
  el.style.setProperty('--row', row);
  el.style.setProperty('--col', col);
}

function updateTileLook(el, value) {
  el.textContent = value;
  if (value <= 2048) {
    el.className = 'tile tile-' + value;
  } else {
    el.className = 'tile tile-super';
  }
}

function addTileElement(tile, isNew) {
  const el = document.createElement('div');
  updateTileLook(el, tile.value);
  setPosition(el, tile.row, tile.col);
  if (isNew) {
    el.classList.add('tile-new');
  }
  board.appendChild(el);
  tileElements[tile.id] = el;
}

// полностью перерисовать плитки (типа новая игра, загрузка, отмена хода)
function drawAllTiles(withAnimation) {
  for (const id in tileElements) {
    tileElements[id].remove();
  }
  tileElements = {};

  const tiles = getAllTiles();
  for (const tile of tiles) {
    addTileElement(tile, withAnimation);
  }
}


// кнопки игры 

function newGame() {
  grid = emptyGrid();
  score = 0;

  // в начале на поле 1-3 плитки
  const count = randomInt(1, 3);
  for (let i = 0; i < count; i++) {
    addRandomTile();
  }

  drawAllTiles(true);
}


// запуск 

createCells();
newGame();
