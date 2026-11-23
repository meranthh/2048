// размер поля
const SIZE = 4;

let grid = [];          // поле 4x4, в клетке лежит плитка или null
let score = 0;
let nextId = 1;         // у каждой плитки свой id

let tileElements = {};  

const board = document.getElementById('board');
const scoreText = document.getElementById('score');


// поле 

// создаём 16 клеток
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

function updateScore() {
  scoreText.textContent = score;
}


// ходы 

// клетки одной линии начиная с той стороныкуда двигаем
function getLine(index, dir) {
  const line = [];
  for (let k = 0; k < SIZE; k++) {
    if (dir === 'left') line.push([index, k]);
    if (dir === 'right') line.push([index, SIZE - 1 - k]);
    if (dir === 'up') line.push([k, index]);
    if (dir === 'down') line.push([SIZE - 1 - k, index]);
  }
  return line;
}

function move(dir) {
  let moved = false;

  for (let i = 0; i < SIZE; i++) {
    const coords = getLine(i, dir);

    let tiles = [];
    for (const [r, c] of coords) {
      if (grid[r][c]) {
        tiles.push(grid[r][c]);
      }
    }

    // сливаем одинаковые соседние плитки пока это возможно
    let wasMerge = true;
    while (wasMerge) {
      wasMerge = false;
      const newTiles = [];
      for (let j = 0; j < tiles.length; j++) {
        if (j + 1 < tiles.length && tiles[j].value === tiles[j + 1].value) {
          tiles[j].value *= 2;
          score += tiles[j].value;
          newTiles.push(tiles[j]);
          j++;
          wasMerge = true;
        } else {
          newTiles.push(tiles[j]);
        }
      }
      tiles = newTiles;
    }

    // ставим плитки на новые места
    for (let k = 0; k < SIZE; k++) {
      const r = coords[k][0];
      const c = coords[k][1];
      const tile = tiles[k] || null;
      if (grid[r][c] !== tile) {
        moved = true;
      }
      grid[r][c] = tile;
      if (tile) {
        tile.row = r;
        tile.col = c;
      }
    }
  }

  if (!moved) {
    return;
  }

  // после хода появляются 1-2 новые плитки
  const newTiles = [];
  const count = randomInt(1, 2);
  for (let i = 0; i < count; i++) {
    const tile = addRandomTile();
    if (tile) {
      newTiles.push(tile);
    }
  }


  updateScore();
  drawAllTiles(false);
}


// кнопочки

function newGame() {
  grid = emptyGrid();
  score = 0;

  // в начале на поле 1-3 плитки
  const count = randomInt(1, 3);
  for (let i = 0; i < count; i++) {
    addRandomTile();
  }

  drawAllTiles(true);
  updateScore();
}


// обработчики 

document.addEventListener('keydown', function (e) {
  let dir = null;
  if (e.key === 'ArrowUp') dir = 'up';
  if (e.key === 'ArrowDown') dir = 'down';
  if (e.key === 'ArrowLeft') dir = 'left';
  if (e.key === 'ArrowRight') dir = 'right';

  if (dir) {
    e.preventDefault();
    move(dir);
  }
});


// запуск 

createCells();
newGame();
