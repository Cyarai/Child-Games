const GAME_ID = 'science-sort';

const ITEMS = [
  { name: 'Bottle', emoji: '🧴', bin: 'plastic' },
  { name: 'Newspaper', emoji: '📰', bin: 'paper' },
  { name: 'Jar', emoji: '🫙', bin: 'glass' },
  { name: 'Cup', emoji: '🥤', bin: 'plastic' },
  { name: 'Cardboard', emoji: '📦', bin: 'paper' },
  { name: 'Wine bottle', emoji: '🍾', bin: 'glass' },
  { name: 'Bag', emoji: '🛍️', bin: 'plastic' },
  { name: 'Notebook', emoji: '📓', bin: 'paper' },
];

const BINS = [
  { id: 'plastic', label: 'Plastic', icon: '🔵' },
  { id: 'paper', label: 'Paper', icon: '🟡' },
  { id: 'glass', label: 'Glass', icon: '🟢' },
];

let sorted = 0;
let mistakes = 0;
let draggedItem = null;

const tray = document.getElementById('items-tray');
const binsRow = document.getElementById('bins-row');
const sortedEl = document.getElementById('sorted');
const mistakesEl = document.getElementById('mistakes');
const totalEl = document.getElementById('total');

totalEl.textContent = ITEMS.length;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createItemEl(item, index) {
  const el = document.createElement('div');
  el.className = 'sort-item';
  el.draggable = true;
  el.dataset.bin = item.bin;
  el.dataset.index = index;
  el.innerHTML = `<span class="emoji">${item.emoji}</span><span>${item.name}</span>`;

  el.addEventListener('dragstart', e => {
    draggedItem = el;
    el.classList.add('dragging');
    e.dataTransfer.setData('text/plain', index);
  });
  el.addEventListener('dragend', () => {
    el.classList.remove('dragging');
    draggedItem = null;
  });

  // Touch support
  let touchClone = null;
  el.addEventListener('touchstart', e => {
    e.preventDefault();
    draggedItem = el;
    el.classList.add('dragging');
  }, { passive: false });

  el.addEventListener('touchmove', e => {
    e.preventDefault();
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    document.querySelectorAll('.bin').forEach(b => b.classList.remove('drag-over'));
    const bin = target?.closest('.bin');
    if (bin) bin.classList.add('drag-over');
  }, { passive: false });

  el.addEventListener('touchend', e => {
    e.preventDefault();
    el.classList.remove('dragging');
    const touch = e.changedTouches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const bin = target?.closest('.bin');
    document.querySelectorAll('.bin').forEach(b => b.classList.remove('drag-over'));
    if (bin && draggedItem) dropItem(draggedItem, bin.dataset.bin);
    draggedItem = null;
  }, { passive: false });

  return el;
}

function renderBins() {
  binsRow.innerHTML = '';
  BINS.forEach(bin => {
    const el = document.createElement('div');
    el.className = `bin bin-${bin.id}`;
    el.dataset.bin = bin.id;
    el.innerHTML = `
      <div class="bin-icon">${bin.icon}</div>
      <div class="bin-label">${bin.label}</div>
      <div class="bin-items"></div>`;

    el.addEventListener('dragover', e => {
      e.preventDefault();
      el.classList.add('drag-over');
    });
    el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
    el.addEventListener('drop', e => {
      e.preventDefault();
      el.classList.remove('drag-over');
      if (draggedItem) dropItem(draggedItem, bin.id);
    });

    binsRow.appendChild(el);
  });
}

function dropItem(itemEl, binId) {
  const correctBin = itemEl.dataset.bin;
  const targetBin = binsRow.querySelector(`[data-bin="${binId}"] .bin-items`);

  if (binId === correctBin) {
    playSound('match');
    itemEl.draggable = false;
    itemEl.style.cursor = 'default';
    targetBin.appendChild(itemEl);
    sorted++;
    sortedEl.textContent = sorted;
    if (sorted === ITEMS.length) endGame();
  } else {
    playSound('lose');
    mistakes++;
    mistakesEl.textContent = mistakes;
    itemEl.style.animation = 'shake 0.4s ease';
    setTimeout(() => itemEl.style.animation = '', 400);
  }
}

function endGame() {
  playSound('win');
  const score = Math.max(10, 100 - mistakes * 15);
  const stars = calcStars(score, [50, 75, 90]);
  saveProgress(GAME_ID, { score, stars });

  document.getElementById('win-message').textContent =
    mistakes === 0
      ? 'Perfect sorting! Zero mistakes!'
      : `All sorted with ${mistakes} mistake${mistakes > 1 ? 's' : ''}. Score: ${score}`;
  document.getElementById('win-stars').innerHTML = starsHtml(stars);
  showOverlay('win-overlay');
}

function resetGame() {
  hideAllOverlays();
  sorted = 0;
  mistakes = 0;
  sortedEl.textContent = '0';
  mistakesEl.textContent = '0';
  tray.innerHTML = '';
  renderBins();
  shuffle(ITEMS).forEach((item, i) => tray.appendChild(createItemEl(item, i)));
}

document.getElementById('btn-start').addEventListener('click', () => {
  hideOverlay('start-overlay');
  resetGame();
});

document.getElementById('btn-play-again').addEventListener('click', resetGame);

renderBins();
