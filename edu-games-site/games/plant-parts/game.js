const GAME_ID = 'plant-parts';

const PARTS = [
  { id: 'flower', label: 'Flower' },
  { id: 'leaf', label: 'Leaf' },
  { id: 'stem', label: 'Stem' },
  { id: 'root', label: 'Root' },
  { id: 'seed', label: 'Seed' },
];

let labeled = 0;
let draggedEl = null;

const tray = document.getElementById('labels-tray');
const labeledEl = document.getElementById('labeled');

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createLabel(part) {
  const el = document.createElement('div');
  el.className = 'label-chip';
  el.textContent = part.label;
  el.dataset.part = part.id;
  el.draggable = true;

  el.addEventListener('dragstart', () => {
    draggedEl = el;
  });
  el.addEventListener('dragend', () => {
    draggedEl = null;
  });

  el.addEventListener('touchstart', e => {
    e.preventDefault();
    draggedEl = el;
  }, { passive: false });

  el.addEventListener('touchmove', e => {
    e.preventDefault();
    const touch = e.touches[0];
    document.querySelectorAll('.drop-zone').forEach(z => z.classList.remove('drag-over'));
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    target?.closest('.drop-zone')?.classList.add('drag-over');
  }, { passive: false });

  el.addEventListener('touchend', e => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const zone = target?.closest('.drop-zone');
    document.querySelectorAll('.drop-zone').forEach(z => z.classList.remove('drag-over'));
    if (zone && draggedEl) tryDrop(draggedEl, zone);
    draggedEl = null;
  }, { passive: false });

  return el;
}

function setupDropZones() {
  document.querySelectorAll('.drop-zone').forEach(zone => {
    zone.addEventListener('dragover', e => {
      e.preventDefault();
      if (!zone.classList.contains('filled')) zone.classList.add('drag-over');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      if (draggedEl) tryDrop(draggedEl, zone);
    });
  });
}

function tryDrop(labelEl, zoneEl) {
  if (zoneEl.classList.contains('filled')) return;

  const part = labelEl.dataset.part;
  const target = zoneEl.dataset.part;

  if (part === target) {
    playSound('match');
    zoneEl.textContent = labelEl.textContent;
    zoneEl.classList.add('filled');
    labelEl.classList.add('placed');
    labeled++;
    labeledEl.textContent = labeled;
    if (labeled === PARTS.length) endGame();
  } else {
    playSound('lose');
    labelEl.style.animation = 'shake 0.4s ease';
    setTimeout(() => labelEl.style.animation = '', 400);
  }
}

function endGame() {
  playSound('win');
  saveProgress(GAME_ID, { score: 100, stars: 3 });
  document.getElementById('win-message').textContent = 'You know all the plant parts!';
  document.getElementById('win-stars').innerHTML = starsHtml(3);
  showOverlay('win-overlay');
}

function resetGame() {
  hideAllOverlays();
  labeled = 0;
  labeledEl.textContent = '0';
  document.querySelectorAll('.drop-zone').forEach(z => {
    z.textContent = '?';
    z.classList.remove('filled');
  });
  tray.innerHTML = '';
  shuffle(PARTS).forEach(p => tray.appendChild(createLabel(p)));
}

document.getElementById('btn-start').addEventListener('click', () => {
  hideOverlay('start-overlay');
  resetGame();
});

document.getElementById('btn-play-again').addEventListener('click', resetGame);

setupDropZones();
