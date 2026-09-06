const GAME_ID = 'memory-match';
const EMOJIS = ['🐶', '🐱', '🐸', '🦋', '🌸', '🍎', '⭐', '🎈'];
const PAIR_COUNT = EMOJIS.length;

let cards = [];
let flipped = [];
let matched = 0;
let moves = 0;
let locked = false;

const board = document.getElementById('board');
const movesEl = document.getElementById('moves');
const pairsEl = document.getElementById('pairs');

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck() {
  return shuffle([...EMOJIS, ...EMOJIS]).map((emoji, i) => ({ id: i, emoji }));
}

function renderBoard() {
  board.innerHTML = '';
  cards.forEach((card, idx) => {
    const el = document.createElement('button');
    el.className = 'memory-card';
    el.innerHTML = `
      <div class="memory-card-inner">
        <div class="memory-card-face memory-card-front">?</div>
        <div class="memory-card-face memory-card-back">${card.emoji}</div>
      </div>`;
    el.addEventListener('click', () => flipCard(idx, el));
    board.appendChild(el);
  });
}

function flipCard(idx, el) {
  if (locked || el.classList.contains('flipped') || el.classList.contains('matched')) return;
  if (flipped.length >= 2) return;

  playSound('flip');
  el.classList.add('flipped');
  flipped.push({ idx, emoji: cards[idx].emoji, el });

  if (flipped.length === 2) {
    moves++;
    movesEl.textContent = moves;
    checkMatch();
  }
}

function checkMatch() {
  locked = true;
  const [a, b] = flipped;

  if (a.emoji === b.emoji) {
    playSound('match');
    setTimeout(() => {
      a.el.classList.add('matched');
      b.el.classList.add('matched');
      matched++;
      pairsEl.textContent = matched;
      flipped = [];
      locked = false;
      if (matched === PAIR_COUNT) endGame();
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

function endGame() {
  playSound('win');
  const score = Math.max(10, 100 - (moves - PAIR_COUNT) * 5);
  const stars = calcStars(score, [40, 70, 90]);
  saveProgress(GAME_ID, { score, stars });

  document.getElementById('win-message').textContent =
    `Completed in ${moves} moves! Score: ${score}`;
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
}

document.getElementById('btn-start').addEventListener('click', () => {
  hideOverlay('start-overlay');
  resetGame();
});

document.getElementById('btn-play-again').addEventListener('click', resetGame);

cards = buildDeck();
renderBoard();
