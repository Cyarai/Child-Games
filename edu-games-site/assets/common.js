/**
 * Educational Games — Shared Helpers
 * Kid login (saved stars), guest play (no saved scores), hub filters, sound
 */

const USERS_KEY = 'edu-games:users';
const SESSION_KEY = 'edu-games:session';
const SOUND_KEY = 'edu-games:soundEnabled';
const MUSIC_KEY = 'edu-games:musicEnabled';
const AVATARS = ['🐻', '🦊', '🐼', '🦄', '🐸', '🐥', '🐙', '🌈', '🐱', '🐰'];

/* ---- Session ---- */

function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function isGuest() {
  const session = getSession();
  return !session || session.mode === 'guest';
}

function isLoggedIn() {
  const session = getSession();
  return Boolean(session && session.mode === 'user' && session.username);
}

function currentPlayer() {
  const session = getSession();
  if (!session) return null;
  if (session.mode === 'guest') {
    return { mode: 'guest', username: 'Guest', avatar: '🎈' };
  }
  const user = getUsers()[normalizeName(session.username)];
  return {
    mode: 'user',
    username: user?.username || session.username,
    avatar: user?.avatar || '⭐',
  };
}

/* ---- Users (stored only on this device) ---- */

function normalizeName(name) {
  return String(name || '').trim().toLowerCase();
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

async function hashPin(pin, salt) {
  const text = salt + ':' + pin;
  if (window.crypto && window.crypto.subtle) {
    const data = new TextEncoder().encode(text);
    const buf = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return 'x' + Math.abs(hash).toString(16);
}

function randomSalt() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function registerPlayer(username, pin, avatar) {
  const name = String(username || '').trim();
  if (name.length < 2 || name.length > 16) {
    return { ok: false, error: 'Pick a nickname 2–16 letters long.' };
  }
  if (!/^[a-zA-Z0-9 ]+$/.test(name)) {
    return { ok: false, error: 'Use letters and numbers only, please!' };
  }
  if (!/^\d{4}$/.test(pin)) {
    return { ok: false, error: 'Your secret code must be 4 numbers.' };
  }

  const users = getUsers();
  const key = normalizeName(name);
  if (users[key]) {
    return { ok: false, error: 'That nickname is already taken on this device.' };
  }

  const salt = randomSalt();
  users[key] = {
    username: name,
    avatar: AVATARS.includes(avatar) ? avatar : AVATARS[0],
    salt,
    pinHash: await hashPin(pin, salt),
    createdAt: Date.now(),
  };
  saveUsers(users);
  setSession({ mode: 'user', username: name });
  return { ok: true };
}

async function loginPlayer(username, pin) {
  const users = getUsers();
  const user = users[normalizeName(username)];
  if (!user) {
    return { ok: false, error: 'We could not find that nickname.' };
  }
  if (!/^\d{4}$/.test(pin)) {
    return { ok: false, error: 'Your secret code must be 4 numbers.' };
  }
  const hash = await hashPin(pin, user.salt);
  if (hash !== user.pinHash) {
    return { ok: false, error: 'Oops! That secret code does not match.' };
  }
  setSession({ mode: 'user', username: user.username });
  return { ok: true };
}

function enterAsGuest() {
  setSession({ mode: 'guest' });
}

function logoutPlayer() {
  clearSession();
  window.location.href = window.location.pathname.includes('/games/')
    ? '../../index.html'
    : 'index.html';
}

/* ---- Progress Tracking ---- */

function progressKey(gameId) {
  const session = getSession();
  if (!session || session.mode !== 'user') return null;
  return 'edu-games:progress:' + normalizeName(session.username) + ':' + gameId;
}

function saveProgress(gameId, data) {
  const existing = getProgress(gameId);
  const merged = { ...existing, ...data, updatedAt: Date.now() };

  if (data.score !== undefined) {
    merged.bestScore = Math.max(existing.bestScore || 0, data.score);
  }
  if (data.stars !== undefined) {
    merged.stars = Math.max(existing.stars || 0, data.stars);
  }

  const key = progressKey(gameId);
  if (!key) return merged;

  try {
    localStorage.setItem(key, JSON.stringify(merged));
  } catch (e) {
    console.warn('Could not save progress:', e);
  }
  return merged;
}

function getProgress(gameId) {
  const key = progressKey(gameId);
  if (!key) return { stars: 0, bestScore: 0 };
  try {
    const raw = localStorage.getItem(key);
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
  if (!cards.length) return;

  if (document.body.dataset.filtersReady === 'true') {
    renderHubProgress();
    return;
  }
  document.body.dataset.filtersReady = 'true';
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
    if (starsEl) starsEl.innerHTML = starsHtml(progress.stars || 0);
    const scoreEl = el.querySelector('.hub-best-score');
    if (scoreEl) {
      scoreEl.textContent = progress.bestScore ? 'Best: ' + progress.bestScore : '';
    }
  });
}

/* ---- Auth UI ---- */

function showAuthPanel(id) {
  document.querySelectorAll('.auth-panel').forEach(p => p.classList.add('hidden'));
  document.getElementById(id)?.classList.remove('hidden');
}

function setAuthError(id, message) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message || '';
}

function openPlayground() {
  document.getElementById('auth-gate')?.classList.add('hidden');
  document.getElementById('app-shell')?.classList.remove('hidden');
  renderPlayerBars();
  if (document.querySelector('.games-grid')) initHubFilters();
  // Start background music when entering the playground
  if (soundEnabled && musicEnabled) {
    // Small delay so AudioContext isn't created before user gesture
    setTimeout(playBgMusic, 100);
  }
}

function initAuthGate() {
  const gate = document.getElementById('auth-gate');
  if (!gate) {
    if (!getSession() && window.location.pathname.includes('/games/')) {
      window.location.href = '../../index.html';
    }
    renderPlayerBars();
    return;
  }

  const session = getSession();
  if (session) {
    openPlayground();
  } else {
    gate.classList.remove('hidden');
    document.getElementById('app-shell')?.classList.add('hidden');
    showAuthPanel('auth-home');
  }

  const avatarRow = document.getElementById('avatar-picker');
  if (avatarRow && !avatarRow.dataset.ready) {
    avatarRow.dataset.ready = 'true';
    AVATARS.forEach((emoji, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'avatar-choice' + (i === 0 ? ' selected' : '');
      btn.textContent = emoji;
      btn.setAttribute('aria-label', 'Choose avatar ' + emoji);
      btn.addEventListener('click', () => {
        avatarRow.querySelectorAll('.avatar-choice').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
      avatarRow.appendChild(btn);
    });
  }

  document.querySelectorAll('#login-pin, #register-pin, #register-pin-confirm').forEach(input => {
    input.addEventListener('input', () => {
      input.value = input.value.replace(/\D/g, '').slice(0, 4);
    });
  });

  document.getElementById('btn-show-login')?.addEventListener('click', () => {
    setAuthError('login-error', '');
    showAuthPanel('auth-login');
  });
  document.getElementById('btn-show-register')?.addEventListener('click', () => {
    setAuthError('register-error', '');
    showAuthPanel('auth-register');
  });
  document.getElementById('btn-guest')?.addEventListener('click', () => {
    enterAsGuest();
    openPlayground();
  });
  document.querySelectorAll('[data-auth-back]').forEach(btn => {
    btn.addEventListener('click', () => {
      setAuthError('login-error', '');
      setAuthError('register-error', '');
      showAuthPanel('auth-home');
    });
  });

  document.getElementById('form-login')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const pin = document.getElementById('login-pin').value;
    const result = await loginPlayer(username, pin);
    if (!result.ok) {
      setAuthError('login-error', result.error);
      return;
    }
    openPlayground();
  });

  document.getElementById('form-register')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const pin = document.getElementById('register-pin').value;
    const pin2 = document.getElementById('register-pin-confirm').value;
    const avatar = document.querySelector('#avatar-picker .avatar-choice.selected')?.textContent || AVATARS[0];
    if (pin !== pin2) {
      setAuthError('register-error', 'Those secret codes do not match yet.');
      return;
    }
    const result = await registerPlayer(username, pin, avatar);
    if (!result.ok) {
      setAuthError('register-error', result.error);
      return;
    }
    openPlayground();
  });
}

function renderPlayerBars() {
  const player = currentPlayer();
  document.querySelectorAll('[data-player-bar]').forEach(bar => {
    if (!player) {
      bar.classList.add('hidden');
      return;
    }
    bar.classList.remove('hidden');
    const avatarEl = bar.querySelector('[data-player-avatar]');
    const nameEl = bar.querySelector('[data-player-name]');
    const noteEl = bar.querySelector('[data-player-note]');
    if (avatarEl) avatarEl.textContent = player.avatar;
    if (nameEl) nameEl.textContent = player.username;
    if (noteEl) {
      noteEl.textContent = player.mode === 'guest'
        ? 'Guest play · scores reset if you refresh'
        : 'Stars are saved on this device';
    }
  });

  document.querySelectorAll('[data-guest-banner]').forEach(el => {
    el.classList.toggle('hidden', !isGuest() || !player);
  });
}

function initLogoutButtons() {
  document.querySelectorAll('[data-logout]').forEach(btn => {
    btn.addEventListener('click', logoutPlayer);
  });
}

/* ---- Sound Toggle ---- */

let soundEnabled = localStorage.getItem(SOUND_KEY) !== 'false';
let musicEnabled = localStorage.getItem(MUSIC_KEY) !== 'false';

/* ---- Background Music Synthesizer ---- */

let _bgMusicCtx = null;
let _bgMusicNodes = [];
let _bgMusicRunning = false;
let _bgMusicStarted = false;

// Cheerful C-major pentatonic melody notes (frequencies in Hz)
const BG_MELODY = [
  { freq: 523.25, dur: 0.3 },  // C5
  { freq: 587.33, dur: 0.3 },  // D5
  { freq: 659.25, dur: 0.3 },  // E5
  { freq: 783.99, dur: 0.3 },  // G5
  { freq: 880.00, dur: 0.3 },  // A5
  { freq: 783.99, dur: 0.3 },  // G5
  { freq: 659.25, dur: 0.45 }, // E5
  { freq: 523.25, dur: 0.3 },  // C5
  { freq: 392.00, dur: 0.3 },  // G4
  { freq: 440.00, dur: 0.3 },  // A4
  { freq: 523.25, dur: 0.45 }, // C5
  { freq: 659.25, dur: 0.3 },  // E5
  { freq: 587.33, dur: 0.3 },  // D5
  { freq: 523.25, dur: 0.6 },  // C5
];

const BG_BASS = [
  { freq: 130.81, dur: 0.6 },  // C3
  { freq: 146.83, dur: 0.6 },  // D3
  { freq: 164.81, dur: 0.6 },  // E3
  { freq: 196.00, dur: 0.6 },  // G3
  { freq: 220.00, dur: 0.6 },  // A3
  { freq: 196.00, dur: 0.6 },  // G3
  { freq: 164.81, dur: 0.9 },  // E3
  { freq: 130.81, dur: 1.2 },  // C3
];

function _getOrCreateBgCtx() {
  if (!_bgMusicCtx || _bgMusicCtx.state === 'closed') {
    _bgMusicCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return _bgMusicCtx;
}

function _scheduleMelody(ctx, notes, gainVal, startTime, waveType) {
  let t = startTime;
  const scheduled = [];
  notes.forEach(note => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g);
    g.connect(ctx.destination);
    osc.type = waveType || 'triangle';
    osc.frequency.value = note.freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gainVal, t + 0.02);
    g.gain.setValueAtTime(gainVal, t + note.dur - 0.05);
    g.gain.linearRampToValueAtTime(0, t + note.dur);
    osc.start(t);
    osc.stop(t + note.dur + 0.01);
    scheduled.push(osc);
    t += note.dur;
  });
  return { nodes: scheduled, duration: t - startTime };
}

function _loopBgMusic() {
  if (!_bgMusicRunning) return;
  try {
    const ctx = _getOrCreateBgCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;

    const melodyResult = _scheduleMelody(ctx, BG_MELODY, 0.07, now, 'triangle');
    // Bass plays at half speed relative to melody total duration
    const bassResult = _scheduleMelody(ctx, BG_BASS, 0.04, now, 'sine');

    const loopDuration = melodyResult.duration;
    _bgMusicNodes = [...melodyResult.nodes, ...bassResult.nodes];

    // Schedule next loop
    setTimeout(() => {
      if (_bgMusicRunning) _loopBgMusic();
    }, (loopDuration - 0.1) * 1000);
  } catch {
    /* audio not available */
  }
}

function playBgMusic() {
  if (!musicEnabled || _bgMusicRunning) return;
  try {
    _bgMusicRunning = true;
    _bgMusicStarted = true;
    _loopBgMusic();
    updateMusicNoteIcon();
  } catch {
    _bgMusicRunning = false;
  }
}

function stopBgMusic() {
  _bgMusicRunning = false;
  _bgMusicNodes.forEach(n => { try { n.stop(); } catch {} });
  _bgMusicNodes = [];
  updateMusicNoteIcon();
}

function updateMusicNoteIcon() {
  const btn = document.getElementById('music-toggle');
  if (!btn) return;
  btn.textContent = (_bgMusicRunning && musicEnabled) ? '🎵' : '🎶';
  btn.classList.toggle('music-playing', _bgMusicRunning && musicEnabled);
  btn.setAttribute('aria-label', (_bgMusicRunning && musicEnabled) ? 'Pause music' : 'Play music');
}

function initMusicToggle() {
  const btn = document.getElementById('music-toggle');
  if (!btn) return;
  updateMusicNoteIcon();
  btn.addEventListener('click', () => {
    musicEnabled = !musicEnabled;
    localStorage.setItem(MUSIC_KEY, musicEnabled);
    if (musicEnabled) {
      playBgMusic();
    } else {
      stopBgMusic();
    }
    updateMusicNoteIcon();
  });
}

function initSoundToggle() {
  const btn = document.getElementById('sound-toggle');
  if (!btn) return;
  updateSoundButton(btn);
  btn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    localStorage.setItem(SOUND_KEY, soundEnabled);
    updateSoundButton(btn);
    if (!soundEnabled && _bgMusicRunning) {
      stopBgMusic();
    } else if (soundEnabled && musicEnabled && !_bgMusicRunning) {
      playBgMusic();
    }
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

    const configs = {
      flip:  { freq: 440,  dur: 0.18, type: 'sine' },
      match: { freq: 660,  dur: 0.25, type: 'triangle' },
      win:   { freq: 880,  dur: 0.35, type: 'triangle' },
      lose:  { freq: 220,  dur: 0.3,  type: 'sawtooth' },
      click: { freq: 520,  dur: 0.15, type: 'sine' },
      pop:   { freq: 700,  dur: 0.12, type: 'sine' },
      right: { freq: 784,  dur: 0.3,  type: 'triangle' },
      wrong: { freq: 196,  dur: 0.3,  type: 'sawtooth' },
    };
    const cfg = configs[type] || configs.click;
    osc.frequency.value = cfg.freq;
    osc.type = cfg.type;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + cfg.dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + cfg.dur + 0.01);

    // Win: play a short ascending arpeggio
    if (type === 'win') {
      [523, 659, 784, 1047].forEach((f, i) => {
        const o2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        o2.connect(g2); g2.connect(ctx.destination);
        o2.type = 'triangle'; o2.frequency.value = f;
        const t = ctx.currentTime + i * 0.12;
        g2.gain.setValueAtTime(0.12, t);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        o2.start(t); o2.stop(t + 0.26);
      });
    }
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

function injectGamePlayerChip() {
  if (!document.body.classList.contains('game-page')) return;
  if (!getSession()) return;
  if (document.querySelector('[data-player-bar]')) {
    renderPlayerBars();
    return;
  }

  const player = currentPlayer();
  if (!player) return;

  const chip = document.createElement('div');
  chip.className = 'player-chip';
  chip.setAttribute('data-player-bar', '');
  chip.innerHTML = `
    <span class="player-avatar" data-player-avatar>${player.avatar}</span>
    <span>
      <strong data-player-name>${player.username}</strong>
      <small data-player-note></small>
    </span>`;
  document.body.appendChild(chip);

  if (isGuest()) {
    const note = document.createElement('p');
    note.className = 'guest-banner';
    note.setAttribute('data-guest-banner', '');
    note.textContent = '🎈 Guest mode: stars and scores disappear if you refresh.';
    const header = document.querySelector('.game-header');
    header?.appendChild(note);
  }

  renderPlayerBars();
}

/* ---- Init on DOM ready ---- */

document.addEventListener('DOMContentLoaded', () => {
  initAuthGate();
  initLogoutButtons();
  injectGamePlayerChip();
  initSoundToggle();
  initMusicToggle();
});
