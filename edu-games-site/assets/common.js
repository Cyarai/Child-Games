/**
 * Educational Games — Shared Helpers
 * Progress tracking (localStorage), hub filters, sound toggle
 */

const PROGRESS_PREFIX = 'edu-games:progress:';
const SOUND_KEY = 'edu-games:soundEnabled';

/* ---- Progress Tracking ---- */

function saveProgress(gameId, data) {
  const existing = getProgress(gameId);
  const merged = { ...existing, ...data, updatedAt: Date.now() };

  if (data.score !== undefined) {
    merged.bestScore = Math.max(existing.bestScore || 0, data.score);
  }
  if (data.stars !== undefined) {
    merged.stars = Math.max(existing.stars || 0, data.stars);
  }

  try {
    localStorage.setItem(PROGRESS_PREFIX + gameId, JSON.stringify(merged));
  } catch (e) {
    console.warn('Could not save progress:', e);
  }
  return merged;
}

function getProgress(gameId) {
  try {
    const raw = localStorage.getItem(PROGRESS_PREFIX + gameId);
    return raw ? JSON.parse(raw) : { stars: 0, bestScore: 0 };
  } catch {
    return { stars: 0, bestScore: 0 };
  }
}

function starsHtml(count, max = 3) {
  let html = '<span class="stars" aria-label="' + count + ' of ' + max + ' stars">';
  for (let i = 1; i <= max; i++) {
    html += '<span class="' + (i <= count ? 'star-filled' : 'star-empty') + '">★</span>';
  }
  html += '</span>';
  return html;
}

function calcStars(score, thresholds) {
  if (score >= thresholds[2]) return 3;
  if (score >= thresholds[1]) return 2;
  if (score >= thresholds[0]) return 1;
  return 0;
}

/* ---- Hub Filters ---- */

function initHubFilters() {
  const cards = document.querySelectorAll('.games-grid .card');
  const noResults = document.getElementById('no-results');
  let activeSubject = 'all';
  let activeLevel = 'all';

  document.querySelectorAll('[data-filter-subject]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter-subject]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeSubject = btn.dataset.filterSubject;
      applyFilters();
    });
  });

  document.querySelectorAll('[data-filter-level]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter-level]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeLevel = btn.dataset.filterLevel;
      applyFilters();
    });
  });

  function applyFilters() {
    let visible = 0;
    cards.forEach(card => {
      const matchSubject = activeSubject === 'all' || card.dataset.subject === activeSubject;
      const matchLevel = activeLevel === 'all' || card.dataset.level === activeLevel;
      const show = matchSubject && matchLevel;
      card.classList.toggle('hidden', !show);
      if (show) visible++;
    });
    if (noResults) noResults.classList.toggle('visible', visible === 0);
  }

  renderHubProgress();
}

function renderHubProgress() {
  document.querySelectorAll('[data-game-id]').forEach(el => {
    const gameId = el.dataset.gameId;
    const progress = getProgress(gameId);
    const starsEl = el.querySelector('.hub-stars');
    if (starsEl) {
      starsEl.innerHTML = starsHtml(progress.stars || 0);
    }
    const scoreEl = el.querySelector('.hub-best-score');
    if (scoreEl && progress.bestScore) {
      scoreEl.textContent = 'Best: ' + progress.bestScore;
    }
  });
}

/* ---- Sound Toggle ---- */

let soundEnabled = localStorage.getItem(SOUND_KEY) !== 'false';

function initSoundToggle() {
  const btn = document.getElementById('sound-toggle');
  if (!btn) return;
  updateSoundButton(btn);
  btn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    localStorage.setItem(SOUND_KEY, soundEnabled);
    updateSoundButton(btn);
  });
}

function updateSoundButton(btn) {
  btn.textContent = soundEnabled ? '🔊' : '🔇';
  btn.setAttribute('aria-label', soundEnabled ? 'Mute sounds' : 'Enable sounds');
}

function playSound(type) {
  if (!soundEnabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const freqs = { flip: 440, match: 660, win: 880, lose: 220, click: 520 };
    osc.frequency.value = freqs[type] || 440;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    /* audio not available */
  }
}

/* ---- Game Page Helpers ---- */

function showOverlay(id) {
  document.getElementById(id)?.classList.add('visible');
}

function hideOverlay(id) {
  document.getElementById(id)?.classList.remove('visible');
}

function hideAllOverlays() {
  document.querySelectorAll('.overlay').forEach(o => o.classList.remove('visible'));
}

/* ---- Init on DOM ready ---- */

document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.games-grid')) initHubFilters();
  initSoundToggle();
});
