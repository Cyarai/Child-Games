const GAME_ID = 'word-match';
const WORDS = ['the', 'and', 'you', 'said', 'was', 'for'];
const PAIR_COUNT = WORDS.length;

let cards = [];
let flipped = [];
let matched = 0;
let moves = 0;
let timer = 0;
let timerInterval = null;
let locked = false;

const board = document.getElementById('board');
const movesEl = document.getElementById('moves');
const pairsEl = document.getElementById('pairs');
const timerEl = document.getElementById('timer');

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck() {
  return shuffle([...WORDS, ...WORDS]).map((word, i) => ({ id: i, word }));
}

function renderBoard() {
  board.innerHTML = '';
  cards.forEach((card, idx) => {
    const el = document.createElement('button');
    el.className = 'memory-card';
    el.dataset.index = idx;
    el.setAttribute('aria-label', 'Memory card');
    el.innerHTML = `
      <div class="memory-card-inner">
        <div class="memory-card-face memory-card-front">?</div>
        <div class="memory-card-face memory-card-back">${card.word}</div>
      </div>`;
    el.addEventListener('click', () => flipCard(idx));
    board.appendChild(el);
  });
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

function stopTimer() {
  clearInterval(timerInterval);
}

function flipCard(idx) {
  if (locked) return;
  const el = board.children[idx];
  if (el.classList.contains('flipped') || el.classList.contains('matched')) return;
  if (flipped.length >= 2) return;

  playSound('flip');
  el.classList.add('flipped');
  flipped.push({ idx, word: cards[idx].word, el });

  if (flipped.length === 2) {
    moves++;
    movesEl.textContent = moves;
    checkMatch();
  }
}

function checkMatch() {
  locked = true;
  const [a, b] = flipped;

  if (a.word === b.word) {
    playSound('match');
    setTimeout(() => {
      a.el.classList.add('matched');
      b.el.classList.add('matched');
      matched++;
      pairsEl.textContent = matched;
      flipped = [];
      locked = false;
      if (matched === PAIR_COUNT) endGame(true);
    }, 400);
  } else {
    setTimeout(() => {
      a.el.classList.remove('flipped');
      b.el.classList.remove('flipped');
      flipped = [];
      locked = false;
    }, 900);
  }
}

function calcScore() {
  const base = 100;
  const movePenalty = Math.max(0, moves - PAIR_COUNT) * 3;
  const timePenalty = Math.max(0, timer - 30);
  return Math.max(10, base - movePenalty - timePenalty);
}

function endGame(won) {
  stopTimer();
  if (!won) return;

  playSound('win');
  const score = calcScore();
  const stars = calcStars(score, [30, 60, 85]);
  saveProgress(GAME_ID, { score, stars });

  document.getElementById('win-message').textContent =
    `Finished in ${moves} moves and ${timer} seconds! Score: ${score}`;
  document.getElementById('win-stars').innerHTML = starsHtml(stars);
  showOverlay('win-overlay');
}

function resetGame() {
  hideAllOverlays();
  cards = buildDeck();
  flipped = [];
  matched = 0;
  moves = 0;
  locked = false;
  movesEl.textContent = '0';
  pairsEl.textContent = '0';
  renderBoard();
  startTimer();
}

document.getElementById('btn-start').addEventListener('click', () => {
  hideOverlay('start-overlay');
  resetGame();
});

document.getElementById('btn-play-again').addEventListener('click', resetGame);

cards = buildDeck();
renderBoard();
