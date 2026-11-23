// размер поля
const SIZE = 4;

let grid = [];          // поле 4x4, в клетке лежит плитка или null
let score = 0;
let prevState = null;   // прошлое состояние для отмены хода
let gameOver = false;
let recordSaved = false;
let nextId = 1;         // у каждой плитки свой id
let isMoving = false;   // пока идёт анимация, новые ходы не принимаем
let moveTimer = null;

let tileElements = {};  

const board = document.getElementById('board');
const scoreText = document.getElementById('score');
const undoBtn = document.getElementById('undo-btn');
const restartBtn = document.getElementById('restart-btn');
const restartBtn2 = document.getElementById('restart-btn-2');
const leadersBtn = document.getElementById('leaders-btn');
const gameOverBlock = document.getElementById('game-over');
const gameOverText = document.getElementById('game-over-text');
const nameInput = document.getElementById('name-input');
const saveBtn = document.getElementById('save-btn');
const leadersModal = document.getElementById('leaders-modal');
const leadersBody = document.getElementById('leaders-body');
const noLeaders = document.getElementById('no-leaders');
const closeLeadersBtn = document.getElementById('close-leaders');


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

// поле в виде чисел (0 = пусто) шобы сохранять
function getValues() {
  const values = [];
  for (let r = 0; r < SIZE; r++) {
    values.push([]);
    for (let c = 0; c < SIZE; c++) {
      values[r].push(grid[r][c] ? grid[r][c].value : 0);
    }
  }
  return values;
}

function setFromValues(values) {
  grid = emptyGrid();
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (values[r][c] !== 0) {
        grid[r][c] = createTile(values[r][c], r, c);
      }
    }
  }
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
  clearTimeout(moveTimer);
  isMoving = false;

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

function updateUndoBtn() {
  undoBtn.disabled = prevState === null || gameOver;
}

// кнопки управления видны ток во время игры
function updateControls() {
  const leadersOpen = !leadersModal.classList.contains('hidden');
  if (gameOver || leadersOpen) {
    document.body.classList.add('no-controls');
  } else {
    document.body.classList.remove('no-controls');
  }
}


// ходы 

// клетки одной линииначиная с той стороны куда двигаем
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
  if (gameOver || isMoving) {
    return;
  }

  const oldValues = getValues();
  const oldScore = score;
  let moved = false;
  const removed = []; // плитки которые слились в другие
  const merged = [];  // плитки которые увеличились

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
          tiles[j + 1].mergedInto = tiles[j];
          removed.push(tiles[j + 1]);
          if (!merged.includes(tiles[j])) {
            merged.push(tiles[j]);
          }
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

  // слившиеся плитки едут туда же куда плитка в которую они слились
  for (const tile of removed) {
    let target = tile.mergedInto;
    while (target.mergedInto) {
      target = target.mergedInto;
    }
    tile.row = target.row;
    tile.col = target.col;
  }

  prevState = { values: oldValues, score: oldScore };

  // после хода появляются 1-2 новые плитки
  const newTiles = [];
  const count = randomInt(1, 2);
  for (let i = 0; i < count; i++) {
    const tile = addRandomTile();
    if (tile) {
      newTiles.push(tile);
    }
  }

  gameOver = !canMove();
  recordSaved = false;

  updateScore();
  updateUndoBtn();
  saveGame();
  animateMove(removed, merged, newTiles);
}

function animateMove(removed, merged, newTiles) {
  isMoving = true;

  // сначала двигаем плитки 
  for (const tile of getAllTiles()) {
    if (tileElements[tile.id]) {
      setPosition(tileElements[tile.id], tile.row, tile.col);
    }
  }
  for (const tile of removed) {
    setPosition(tileElements[tile.id], tile.row, tile.col);
  }

  // после движения убираем лишние, обновляем числа и добавляем новые
  moveTimer = setTimeout(function () {
    for (const tile of merged) {
      if (tile.mergedInto) continue;
      const el = tileElements[tile.id];
      updateTileLook(el, tile.value);
      void el.offsetWidth; // шоб анимация запустилась заново
      el.classList.add('tile-merged');
    }

    for (const tile of removed) {
      tileElements[tile.id].remove();
      delete tileElements[tile.id];
    }

    for (const tile of newTiles) {
      addTileElement(tile, true);
    }

    isMoving = false;

    if (gameOver) {
      showGameOver();
    }
  }, 120);
}

// есть ли хоть один возможный ход
function canMove() {
  if (getEmptyCells().length > 0) {
    return true;
  }
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const value = grid[r][c].value;
      if (c < SIZE - 1 && grid[r][c + 1].value === value) return true;
      if (r < SIZE - 1 && grid[r + 1][c].value === value) return true;
    }
  }
  return false;
}


// кнопочки

function newGame() {
  grid = emptyGrid();
  score = 0;
  prevState = null;
  gameOver = false;
  recordSaved = false;

  // в начале на поле 1-3 плитки
  const count = randomInt(1, 3);
  for (let i = 0; i < count; i++) {
    addRandomTile();
  }

  drawAllTiles(true);
  hideGameOver();
  updateScore();
  updateUndoBtn();
  saveGame();
}

function undo() {
  if (prevState === null || gameOver) {
    return;
  }
  setFromValues(prevState.values);
  score = prevState.score;
  prevState = null;

  drawAllTiles(false);
  updateScore();
  updateUndoBtn();
  saveGame();
}


// конец игры 

function showGameOver() {
  gameOverBlock.classList.remove('hidden');
  if (recordSaved) {
    gameOverText.textContent = 'Ваш рекорд сохранен';
    nameInput.classList.add('hidden');
    saveBtn.classList.add('hidden');
  } else {
    gameOverText.textContent = 'Игра окончена! Ваш счёт: ' + score;
    nameInput.classList.remove('hidden');
    saveBtn.classList.remove('hidden');
    nameInput.value = '';
  }
  updateControls();
}

function hideGameOver() {
  gameOverBlock.classList.add('hidden');
  updateControls();
}

function saveRecord() {
  const name = nameInput.value.trim();
  if (name === '') {
    nameInput.focus();
    return;
  }

  const leaders = getLeaders();
  leaders.push({
    name: name,
    score: score,
    date: new Date().toLocaleDateString('ru-RU')
  });
  leaders.sort(function (a, b) {
    return b.score - a.score;
  });
  localStorage.setItem('leaders2048', JSON.stringify(leaders.slice(0, 10)));

  recordSaved = true;
  saveGame();

  gameOverText.textContent = 'Ваш рекорд сохранен';
  nameInput.classList.add('hidden');
  saveBtn.classList.add('hidden');
}


// таблица лидеров

function getLeaders() {
  const data = localStorage.getItem('leaders2048');
  if (data) {
    return JSON.parse(data);
  }
  return [];
}

function showLeaders() {
  const leaders = getLeaders();
  leadersBody.innerHTML = '';

  for (const leader of leaders) {
    const tr = document.createElement('tr');

    const nameTd = document.createElement('td');
    nameTd.textContent = leader.name;
    const scoreTd = document.createElement('td');
    scoreTd.textContent = leader.score;
    const dateTd = document.createElement('td');
    dateTd.textContent = leader.date;

    tr.appendChild(nameTd);
    tr.appendChild(scoreTd);
    tr.appendChild(dateTd);
    leadersBody.appendChild(tr);
  }

  if (leaders.length === 0) {
    noLeaders.classList.remove('hidden');
  } else {
    noLeaders.classList.add('hidden');
  }

  leadersModal.classList.remove('hidden');
  updateControls();
}

function closeLeaders() {
  leadersModal.classList.add('hidden');
  updateControls();
}


// сохранение 

function saveGame() {
  const data = {
    grid: getValues(),
    score: score,
    prevState: prevState,
    gameOver: gameOver,
    recordSaved: recordSaved
  };
  localStorage.setItem('game2048', JSON.stringify(data));
}

function loadGame() {
  const saved = localStorage.getItem('game2048');
  if (!saved) {
    return false;
  }
  try {
    const data = JSON.parse(saved);
    setFromValues(data.grid);
    score = data.score;
    prevState = data.prevState;
    gameOver = data.gameOver;
    recordSaved = data.recordSaved;
    return true;
  } catch (e) {
    return false;
  }
}


// обработчики 

document.addEventListener('keydown', function (e) {
  if (!leadersModal.classList.contains('hidden')) {
    return;
  }

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

const controlButtons = document.querySelectorAll('.control-btn');
controlButtons.forEach(function (btn) {
  btn.addEventListener('click', function () {
    move(btn.dataset.dir);
  });
});

undoBtn.addEventListener('click', undo);
restartBtn.addEventListener('click', newGame);
restartBtn2.addEventListener('click', newGame);
leadersBtn.addEventListener('click', showLeaders);
closeLeadersBtn.addEventListener('click', closeLeaders);
saveBtn.addEventListener('click', saveRecord);
nameInput.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    saveRecord();
  }
});


// запуск 

createCells();

if (loadGame()) {
  drawAllTiles(false);
  updateScore();
  updateUndoBtn();
  if (gameOver) {
    showGameOver();
  } else {
    updateControls();
  }
} else {
  newGame();
}
