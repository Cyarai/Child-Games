const GAME_ID = 'math-blaster';
const TIME_LIMIT = 60;

let score = 0;
let streak = 0;
let bestStreak = 0;
let timeLeft = TIME_LIMIT;
let timerInterval = null;
let currentAnswer = 0;
let playing = false;

const scoreEl = document.getElementById('score');
const streakEl = document.getElementById('streak');
const timerEl = document.getElementById('timer');
const questionEl = document.getElementById('question');
const answersEl = document.getElementById('answers');

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateQuestion() {
  const isAdd = Math.random() > 0.4;
  let a, b, answer, text;

  if (isAdd) {
    a = randInt(1, 20);
    b = randInt(1, 20);
    answer = a + b;
    text = `${a} + ${b} = ?`;
  } else {
    a = randInt(5, 25);
    b = randInt(1, a);
    answer = a - b;
    text = `${a} − ${b} = ?`;
  }

  currentAnswer = answer;
  questionEl.textContent = text;

  const wrong = new Set();
  while (wrong.size < 3) {
    const offset = randInt(-5, 5) || randInt(1, 3);
    const w = answer + offset;
    if (w !== answer && w >= 0) wrong.add(w);
  }

  const options = shuffle([answer, ...wrong]);
  answersEl.innerHTML = '';
  options.forEach(val => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.textContent = val;
    btn.addEventListener('click', () => pickAnswer(val, btn));
    answersEl.appendChild(btn);
  });
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickAnswer(val, btn) {
  if (!playing) return;
  const buttons = answersEl.querySelectorAll('.answer-btn');
  buttons.forEach(b => b.style.pointerEvents = 'none');

  if (val === currentAnswer) {
    playSound('match');
    btn.classList.add('correct');
    streak++;
    bestStreak = Math.max(bestStreak, streak);
    const bonus = Math.min(streak - 1, 5);
    score += 10 + bonus;
    scoreEl.textContent = score;
    streakEl.textContent = streak;
    document.querySelector('.question-area').classList.add('flash-correct');
    setTimeout(() => {
      document.querySelector('.question-area').classList.remove('flash-correct');
      generateQuestion();
    }, 350);
  } else {
    playSound('lose');
    btn.classList.add('wrong');
    buttons.forEach(b => {
      if (parseInt(b.textContent) === currentAnswer) b.classList.add('correct');
    });
    streak = 0;
    streakEl.textContent = '0';
    setTimeout(generateQuestion, 700);
  }
}

function startTimer() {
  clearInterval(timerInterval);
  timeLeft = TIME_LIMIT;
  timerEl.textContent = timeLeft;
  timerInterval = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;
    if (timeLeft <= 0) endGame();
  }, 1000);
}

function endGame() {
  playing = false;
  clearInterval(timerInterval);
  playSound('win');

  const stars = calcStars(score, [50, 100, 150]);
  saveProgress(GAME_ID, { score, stars });

  document.getElementById('end-title').textContent = "Time's Up!";
  document.getElementById('end-message').textContent =
    `You scored ${score} points! Best streak: ${bestStreak}`;
  document.getElementById('end-stars').innerHTML = starsHtml(stars);
  showOverlay('end-overlay');
}

function resetGame() {
  hideAllOverlays();
  score = 0;
  streak = 0;
  bestStreak = 0;
  playing = true;
  scoreEl.textContent = '0';
  streakEl.textContent = '0';
  generateQuestion();
  startTimer();
}

document.getElementById('btn-start').addEventListener('click', () => {
  hideOverlay('start-overlay');
  resetGame();
});

document.getElementById('btn-play-again').addEventListener('click', resetGame);
