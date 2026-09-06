const GAME_ID = 'shape-sort';

const SHAPES = [
  { type: 'circle', label: 'Circles' },
  { type: 'square', label: 'Squares' },
  { type: 'triangle', label: 'Triangles' },
];

let deck = [];
let selected = null;
let sorted = 0;

const tray = document.getElementById('shapes-tray');
const bucketsRow = document.getElementById('buckets-row');
const sortedEl = document.getElementById('sorted');
const totalEl = document.getElementById('total');

function buildDeck() {
  const items = [];
  SHAPES.forEach(s => {
    for (let i = 0; i < 3; i++) items.push(s.type);
  });
  return shuffle(items);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shapeHtml(type) {
  return `<div class="shape-${type}"></div>`;
}

function renderTray() {
  tray.innerHTML = '';
  deck.forEach((type, i) => {
    const el = document.createElement('button');
    el.className = 'shape-item';
    el.dataset.type = type;
    el.dataset.index = i;
    el.innerHTML = shapeHtml(type);
    el.addEventListener('click', () => selectShape(el));
    tray.appendChild(el);
  });
}

function renderBuckets() {
  bucketsRow.innerHTML = '';
  SHAPES.forEach(s => {
    const el = document.createElement('button');
    el.className = 'bucket';
    el.dataset.type = s.type;
    el.innerHTML = `
      <div class="bucket-label">${s.label}</div>
      <div class="bucket-shapes" id="bucket-${s.type}"></div>`;
    el.addEventListener('click', () => dropInBucket(s.type, el));
    bucketsRow.appendChild(el);
  });
}

function selectShape(el) {
  playSound('click');
  document.querySelectorAll('.shape-item').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  selected = el;
  document.getElementById('hint').textContent = 'Now tap the matching bucket!';
}

function dropInBucket(type, bucketEl) {
  if (!selected) {
    document.getElementById('hint').textContent = 'Pick a shape first!';
    return;
  }

  const shapeType = selected.dataset.type;

  if (shapeType === type) {
    playSound('match');
    const container = document.getElementById('bucket-' + type);
    const clone = document.createElement('div');
    clone.className = 'shape-item';
    clone.innerHTML = shapeHtml(type);
    container.appendChild(clone);

    const idx = selected.dataset.index;
    selected.remove();
    selected = null;
    sorted++;
    sortedEl.textContent = sorted;
    document.getElementById('hint').textContent =
      tray.children.length === 0 ? 'Great job!' : 'Tap another shape!';

    if (tray.children.length === 0) endGame();
  } else {
    playSound('lose');
    selected.classList.add('wrong');
    setTimeout(() => selected?.classList.remove('wrong'), 400);
    document.getElementById('hint').textContent = 'Oops! Try a different bucket.';
  }
}

function endGame() {
  playSound('win');
  const score = 100;
  const stars = 3;
  saveProgress(GAME_ID, { score, stars });

  document.getElementById('win-message').textContent = 'You sorted all 9 shapes perfectly!';
  document.getElementById('win-stars').innerHTML = starsHtml(stars);
  showOverlay('win-overlay');
}

function resetGame() {
  hideAllOverlays();
  deck = buildDeck();
  selected = null;
  sorted = 0;
  sortedEl.textContent = '0';
  totalEl.textContent = deck.length;
  document.getElementById('hint').textContent = 'Tap a shape below, then tap its bucket.';
  renderBuckets();
  renderTray();
}

document.getElementById('btn-start').addEventListener('click', () => {
  hideOverlay('start-overlay');
  resetGame();
});

document.getElementById('btn-play-again').addEventListener('click', resetGame);

renderBuckets();
