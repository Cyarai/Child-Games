/**
 * Number Bubbles — game.js
 * Follows the shared common.js pattern: GAME_ID, saveProgress, calcStars, playSound
 */

const GAME_ID = 'number-bubbles';
const MAX_NUMBER = 10;
const GAME_DURATION = 30; // seconds

const BUBBLE_COLORS = [
  { bg: '#ff6b81', shadow: '#e84e67', text: '#fff' },  // pink
  { bg: '#ffb347', shadow: '#f59e0b', text: '#fff' },  // orange
  { bg: '#4ade80', shadow: '#22c55e', text: '#fff' },  // green
  { bg: '#60a5fa', shadow: '#3b82f6', text: '#fff' },  // blue
  { bg: '#c084fc', shadow: '#9333ea', text: '#fff' },  // purple
  { bg: '#f472b6', shadow: '#ec4899', text: '#fff' },  // rose
  { bg: '#34d399', shadow: '#059669', text: '#fff' },  // teal
  { bg: '#fbbf24', shadow: '#d97706', text: '#fff' },  // yellow
  { bg: '#fb923c', shadow: '#ea580c', text: '#fff' },  // amber
  { bg: '#a78bfa', shadow: '#7c3aed', text: '#fff' },  // violet
];

let nextExpected = 1;
let score = 0;
let timeLeft = GAME_DURATION;
let timerInterval = null;
let bubbleInterval = null;
let activeBubbles = {};
let gameRunning = false;

const arena     = document.getElementById('bubble-arena');
const timerEl   = document.getElementById('timer');
const nextEl    = document.getElementById('next-num');
const scoreEl   = document.getElementById('score');

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

// Spawn one bubble with a given number
function spawnBubble(num) {
  if (!gameRunning) return;
  if (activeBubbles[num]) return; // already on screen

  const color = BUBBLE_COLORS[(num - 1) % BUBBLE_COLORS.length];
  const size = randomBetween(68, 88);
  const leftPct = randomBetween(5, 80);
  const duration = randomBetween(5, 9); // float-up speed
  const delay = randomBetween(0, 1.5);

  const bubble = document.createElement('button');
  bubble.className = 'bubble';
  bubble.id = `bubble-${num}`;
  bubble.setAttribute('aria-label', `Bubble ${num}`);
  bubble.innerHTML = `<span>${num}</span>`;
  bubble.style.cssText = `
    width: ${size}px;
    height: ${size}px;
    left: ${leftPct}%;
    background: radial-gradient(circle at 35% 35%, ${color.bg}dd, ${color.bg});
    border-color: ${color.bg};
    box-shadow: 0 6px 0 ${color.shadow}, inset 0 3px 6px rgba(255,255,255,0.4);
    color: ${color.text};
    font-size: ${size * 0.38}px;
    animation: riseBubble ${duration}s ${delay}s ease-in forwards;
  `;

  bubble.addEventListener('click', () => popBubble(num, bubble));
  bubble.addEventListener('touchstart', (e) => {
    e.preventDefault();
    popBubble(num, bubble);
  }, { passive: false });

  arena.appendChild(bubble);
  activeBubbles[num] = bubble;

  // Remove bubble if it floats off screen without being popped
  bubble.addEventListener('animationend', () => {
    if (activeBubbles[num]) {
      delete activeBubbles[num];
      bubble.remove();
      // Re-spawn after a moment
      if (gameRunning) {
        setTimeout(() => spawnBubble(num), randomBetween(800, 2000));
      }
    }
  });
}

function popBubble(num, bubble) {
  if (!gameRunning) return;

  if (num === nextExpected) {
    // Correct!
    playSound('pop');
    score += 10;
    scoreEl.textContent = score;
    nextExpected++;
    nextEl.textContent = nextExpected <= MAX_NUMBER ? nextExpected : '🎉';

    // Burst animation
    bubble.classList.add('popped');
    delete activeBubbles[num];
    setTimeout(() => bubble.remove(), 300);

    // Show +10 floating indicator
    showPlusPoints(bubble);

    if (nextExpected > MAX_NUMBER) {
      // All popped!
      setTimeout(winGame, 500);
    }
  } else {
    // Wrong order
    playSound('wrong');
    bubble.classList.add('wrong-shake');
    setTimeout(() => bubble.classList.remove('wrong-shake'), 400);

    // Penalty
    score = Math.max(0, score - 3);
    scoreEl.textContent = score;
  }
}

function showPlusPoints(bubble) {
  const indicator = document.createElement('div');
  indicator.className = 'points-indicator';
  indicator.textContent = '+10';
  const rect = bubble.getBoundingClientRect();
  const arenaRect = arena.getBoundingClientRect();
  indicator.style.left = (rect.left - arenaRect.left + rect.width / 2) + 'px';
  indicator.style.top  = (rect.top  - arenaRect.top)  + 'px';
  arena.appendChild(indicator);
  setTimeout(() => indicator.remove(), 700);
}

function spawnAllBubbles() {
  // Stagger all 10 bubbles spawning at start
  for (let n = 1; n <= MAX_NUMBER; n++) {
    setTimeout(() => {
      if (gameRunning) spawnBubble(n);
    }, (n - 1) * 300);
  }
}

function startTimer() {
  timerEl.textContent = timeLeft;
  timerInterval = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;
    if (timeLeft <= 5) timerEl.style.color = '#be185d';
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      loseGame();
    }
  }, 1000);
}

function winGame() {
  gameRunning = false;
  clearInterval(timerInterval);
  playSound('win');

  const finalScore = score + timeLeft * 2; // time bonus
  const stars = calcStars(finalScore, [60, 90, 110]);
  saveProgress(GAME_ID, { score: finalScore, stars });

  document.getElementById('win-message').textContent =
    `Score: ${finalScore} (includes ${timeLeft * 2} time bonus! ⏱️)`;
  document.getElementById('win-stars').innerHTML = starsHtml(stars);
  showOverlay('win-overlay');
}

function loseGame() {
  gameRunning = false;
  clearInterval(timerInterval);
  playSound('lose');

  const stars = calcStars(nextExpected - 1, [3, 6, 9]);
  saveProgress(GAME_ID, { score, stars });

  document.getElementById('lose-message').textContent =
    `You popped ${nextExpected - 1} out of 10 bubbles. Score: ${score}`;
  showOverlay('lose-overlay');
}

function clearArena() {
  arena.innerHTML = '';
  activeBubbles = {};
}

function startGame() {
  hideAllOverlays();
  clearArena();
  nextExpected = 1;
  score = 0;
  timeLeft = GAME_DURATION;
  gameRunning = true;

  scoreEl.textContent = '0';
  nextEl.textContent = '1';
  timerEl.textContent = GAME_DURATION;
  timerEl.style.color = '';

  spawnAllBubbles();
  startTimer();
}

document.getElementById('btn-start').addEventListener('click', () => {
  hideOverlay('start-overlay');
  startGame();
});
document.getElementById('btn-play-again').addEventListener('click', startGame);
document.getElementById('btn-try-again').addEventListener('click', startGame);
