/**
 * Educational Games — Login & Guest Auth
 * Logged-in users: progress saved in localStorage (persists across visits)
 * Guests: progress in sessionStorage only (clears on refresh)
 */

const USERS_KEY = 'edu-games:users';
const USER_SESSION_KEY = 'edu-games:user-session';
const GUEST_SESSION_KEY = 'edu-games:guest-session';

function simpleHash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
  }
  return 'h' + (h >>> 0).toString(36);
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

function getSession() {
  try {
    const guest = sessionStorage.getItem(GUEST_SESSION_KEY);
    if (guest) return JSON.parse(guest);
    const user = localStorage.getItem(USER_SESSION_KEY);
    if (user) return JSON.parse(user);
  } catch {
    /* ignore */
  }
  return null;
}

function isGuest() {
  const s = getSession();
  return s?.isGuest === true;
}

function isLoggedIn() {
  const s = getSession();
  return s && !s.isGuest && s.username;
}

function getCurrentUsername() {
  const s = getSession();
  return s?.isGuest ? null : s?.username || null;
}

function getLoginUrl() {
  return window.location.pathname.includes('/games/') ? '../../login.html' : 'login.html';
}

function getHubUrl() {
  return window.location.pathname.includes('/games/') ? '../../index.html' : 'index.html';
}

function requireAuth() {
  if (!getSession()) {
    window.location.href = getLoginUrl();
    return false;
  }
  return true;
}

function loginAsGuest() {
  localStorage.removeItem(USER_SESSION_KEY);
  sessionStorage.setItem(GUEST_SESSION_KEY, JSON.stringify({ isGuest: true, startedAt: Date.now() }));
}

function loginUser(username, pin) {
  const users = getUsers();
  const key = username.trim().toLowerCase();
  const user = users[key];
  if (!user || user.pinHash !== simpleHash(pin)) {
    return { ok: false, error: 'Wrong name or PIN. Try again!' };
  }
  sessionStorage.removeItem(GUEST_SESSION_KEY);
  localStorage.setItem(USER_SESSION_KEY, JSON.stringify({
    username: key,
    displayName: user.displayName || username.trim(),
    isGuest: false,
  }));
  return { ok: true };
}

function signupUser(username, pin) {
  const name = username.trim();
  const key = name.toLowerCase();

  if (name.length < 2) {
    return { ok: false, error: 'Pick a name with at least 2 letters!' };
  }
  if (!/^[a-zA-Z0-9 _-]+$/.test(name)) {
    return { ok: false, error: 'Use letters and numbers only in your name.' };
  }
  if (!/^\d{4}$/.test(pin)) {
    return { ok: false, error: 'PIN must be exactly 4 numbers.' };
  }

  const users = getUsers();
  if (users[key]) {
    return { ok: false, error: 'That name is taken. Try another one!' };
  }

  users[key] = {
    displayName: name,
    pinHash: simpleHash(pin),
    progress: {},
    createdAt: Date.now(),
  };
  saveUsers(users);

  sessionStorage.removeItem(GUEST_SESSION_KEY);
  localStorage.setItem(USER_SESSION_KEY, JSON.stringify({
    username: key,
    displayName: name,
    isGuest: false,
  }));

  return { ok: true };
}

function logout() {
  sessionStorage.removeItem(GUEST_SESSION_KEY);
  localStorage.removeItem(USER_SESSION_KEY);
  window.location.href = getLoginUrl();
}

function initUserBar() {
  const bar = document.getElementById('user-bar');
  if (!bar) return;

  const session = getSession();
  if (!session) return;

  const nameEl = bar.querySelector('.user-bar-name');
  const badgeEl = bar.querySelector('.user-bar-badge');
  const logoutBtn = bar.querySelector('#btn-logout');

  if (session.isGuest) {
    if (nameEl) nameEl.textContent = '👋 Guest Player';
    if (badgeEl) {
      badgeEl.textContent = 'Guest — scores reset on refresh';
      badgeEl.className = 'user-bar-badge badge-guest';
    }
  } else {
    if (nameEl) nameEl.textContent = '⭐ Hi, ' + (session.displayName || session.username) + '!';
    if (badgeEl) {
      badgeEl.textContent = 'Your stars are saved!';
      badgeEl.className = 'user-bar-badge badge-saved';
    }
  }

  logoutBtn?.addEventListener('click', logout);
}

function initGuestBanner() {
  const banner = document.getElementById('guest-banner');
  if (!banner || !isGuest()) return;
  banner.hidden = false;
}

function redirectIfLoggedIn() {
  if (getSession() && document.body.classList.contains('login-page')) {
    window.location.href = getHubUrl();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.body.dataset.requireAuth !== 'false') {
    const isLoginPage = document.body.classList.contains('login-page');
    if (!isLoginPage) requireAuth();
  }
  redirectIfLoggedIn();
  initUserBar();
  initGuestBanner();
});
