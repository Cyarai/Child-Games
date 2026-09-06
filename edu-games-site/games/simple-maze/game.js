const GAME_ID = 'simple-maze';

// 1 = wall, 0 = path, 2 = start, 3 = finish
const MAZE = [
  [1,1,1,1,1,1,1,1,1,1],
  [2,0,0,1,0,0,0,0,0,1],
  [1,1,0,1,0,1,1,1,0,1],
  [1,0,0,0,0,0,0,1,0,1],
  [1,0,1,1,1,1,0,1,0,1],
  [1,0,0,0,0,1,0,0,0,1],
  [1,1,1,1,0,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,1,1,1,3,1],
  [1,1,1,1,1,1,1,1,1,1],
];

const CELL = 30;
let player = { row: 1, col: 0 };
let moves = 0;
let timer = 0;
let timerInterval = null;
let playing = false;

const canvas = document.getElementById('maze');
const ctx = canvas.getContext('2d');
const movesEl = document.getElementById('moves');
const timerEl = document.getElementById('timer');

function findStart() {
  for (let r = 0; r < MAZE.length; r++) {
    for (let c = 0; c < MAZE[r].length; c++) {
      if (MAZE[r][c] === 2) return { row: r, col: c };
    }
  }
  return { row: 1, col: 0 };
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let r = 0; r < MAZE.length; r++) {
    for (let c = 0; c < MAZE[r].length; c++) {
      const x = c * CELL;
      const y = r * CELL;
      const cell = MAZE[r][c];

      if (cell === 1) {
        ctx.fillStyle = '#636e72';
        ctx.fillRect(x, y, CELL, CELL);
      } else {
        ctx.fillStyle = '#f0f7ff';
        ctx.fillRect(x, y, CELL, CELL);
      }

      if (cell === 3) {
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏁', x + CELL / 2, y + CELL / 2);
      }
    }
  }

  ctx.font = '22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⭐', player.col * CELL + CELL / 2, player.row * CELL + CELL / 2);
}

function canMove(row, col) {
  if (row < 0 || col < 0 || row >= MAZE.length || col >= MAZE[0].length) return false;
  return MAZE[row][col] !== 1;
}

function move(dir) {
  if (!playing) return;

  const deltas = {
    up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1]
  };
  const [dr, dc] = deltas[dir];
  const nr = player.row + dr;
  const nc = player.col + dc;

  if (!canMove(nr, nc)) {
    playSound('lose');
    return;
  }

  playSound('click');
  player = { row: nr, col: nc };
  moves++;
  movesEl.textContent = moves;
  draw();

  if (MAZE[nr][nc] === 3) endGame();
}

function startTimer() {
  clearInterval(timerInterval);
  timer = 0;
  timerEl.textContent = '0';
  timerInterval = setInterval(() => {
    timer++;
    timerEl.textContent = timer;
  }, 1000);
}

function endGame() {
  playing = false;
  clearInterval(timerInterval);
  playSound('win');

  const score = Math.max(10, 120 - moves * 2 - timer);
  const stars = calcStars(score, [50, 80, 100]);
  saveProgress(GAME_ID, { score, stars });

  document.getElementById('win-message').textContent =
    `Finished in ${moves} moves and ${timer} seconds! Score: ${score}`;
  document.getElementById('win-stars').innerHTML = starsHtml(stars);
  showOverlay('win-overlay');
}

function resetGame() {
  hideAllOverlays();
  player = findStart();
  moves = 0;
  playing = true;
  movesEl.textContent = '0';
  draw();
  startTimer();
}

document.getElementById('btn-start').addEventListener('click', () => {
  hideOverlay('start-overlay');
  resetGame();
});

document.getElementById('btn-play-again').addEventListener('click', resetGame);

document.querySelectorAll('.dpad-btn').forEach(btn => {
  btn.addEventListener('click', () => move(btn.dataset.dir));
});

document.addEventListener('keydown', e => {
  const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
  if (map[e.key]) {
    e.preventDefault();
    move(map[e.key]);
  }
});

canvas.width = MAZE[0].length * CELL;
canvas.height = MAZE.length * CELL;
player = findStart();
draw();
