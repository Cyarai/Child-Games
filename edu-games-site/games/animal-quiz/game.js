/**
 * Animal Quiz — game.js
 * Follows the shared common.js pattern: GAME_ID, saveProgress, calcStars, playSound
 */

const GAME_ID = 'animal-quiz';
const TOTAL_QUESTIONS = 10;

const ALL_ANIMALS = [
  { emoji: '🐘', name: 'Elephant',  clue: 'I have a very long trunk and big floppy ears!', hint: '🌿' },
  { emoji: '🦒', name: 'Giraffe',   clue: 'I have the longest neck of any animal!', hint: '🌳' },
  { emoji: '🐬', name: 'Dolphin',   clue: 'I love to jump and swim in the ocean!', hint: '🌊' },
  { emoji: '🦋', name: 'Butterfly', clue: 'I have beautiful colorful wings!', hint: '🌸' },
  { emoji: '🐧', name: 'Penguin',   clue: 'I wear a black-and-white suit and live on ice!', hint: '❄️' },
  { emoji: '🦁', name: 'Lion',      clue: 'I am the king of the jungle with a big mane!', hint: '🌾' },
  { emoji: '🐢', name: 'Turtle',    clue: 'I carry my house on my back and walk very slowly!', hint: '🍃' },
  { emoji: '🦉', name: 'Owl',       clue: 'I stay awake at night and say Hoo-Hoo!', hint: '🌙' },
  { emoji: '🐊', name: 'Crocodile', clue: 'I have lots of sharp teeth and love to swim in rivers!', hint: '💧' },
  { emoji: '🦩', name: 'Flamingo',  clue: 'I am pink and I love to stand on one leg!', hint: '🌺' },
  { emoji: '🐨', name: 'Koala',     clue: 'I hug trees in Australia and eat eucalyptus leaves!', hint: '🌿' },
  { emoji: '🦓', name: 'Zebra',     clue: 'I look like a horse with black-and-white stripes!', hint: '🌾' },
  { emoji: '🦜', name: 'Parrot',    clue: 'I can copy what you say and I have bright feathers!', hint: '🌴' },
  { emoji: '🐺', name: 'Wolf',      clue: 'I howl at the moon and run with a pack!', hint: '🌕' },
  { emoji: '🦔', name: 'Hedgehog',  clue: 'I have sharp spines all over my back!', hint: '🍂' },
  { emoji: '🐙', name: 'Octopus',   clue: 'I have eight arms and live in the deep sea!', hint: '🌊' },
  { emoji: '🦘', name: 'Kangaroo',  clue: 'I carry my baby in a pouch and love to hop!', hint: '🌵' },
  { emoji: '🐸', name: 'Frog',      clue: 'I jump high and love the rain — ribbit!', hint: '🍃' },
  { emoji: '🦅', name: 'Eagle',     clue: 'I soar high in the sky with powerful wings!', hint: '🏔️' },
  { emoji: '🐼', name: 'Panda',     clue: 'I am black and white and love to eat bamboo!', hint: '🎋' },
];

let questions = [];
let currentQ = 0;
let score = 0;
let streak = 0;
let answered = false;

const scoreEl  = document.getElementById('score');
const qNumEl   = document.getElementById('q-num');
const streakEl = document.getElementById('streak');
const clueIcon = document.getElementById('clue-icon');
const clueText = document.getElementById('clue-text');
const choicesEl = document.getElementById('choices');
const feedbackEl = document.getElementById('feedback');

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestions() {
  const pool = shuffle(ALL_ANIMALS).slice(0, TOTAL_QUESTIONS);
  return pool.map(correct => {
    // Pick 3 wrong answers from the rest
    const others = ALL_ANIMALS.filter(a => a.name !== correct.name);
    const wrongs = shuffle(others).slice(0, 3);
    const choices = shuffle([correct, ...wrongs]);
    return { correct, choices };
  });
}

function renderQuestion() {
  answered = false;
  feedbackEl.textContent = '';
  feedbackEl.className = 'feedback-msg';

  const q = questions[currentQ];
  qNumEl.textContent = currentQ + 1;

  // Animate clue box
  const clueBox = document.getElementById('clue-box');
  clueBox.classList.remove('pop-in');
  void clueBox.offsetWidth; // reflow
  clueBox.classList.add('pop-in');

  clueIcon.textContent = q.correct.hint;
  clueText.textContent = q.correct.clue;

  choicesEl.innerHTML = '';
  q.choices.forEach(animal => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.innerHTML = `<span class="choice-emoji">${animal.emoji}</span><span class="choice-name">${animal.name}</span>`;
    btn.setAttribute('aria-label', `Choose ${animal.name}`);
    btn.addEventListener('click', () => handleAnswer(animal, btn, q.correct));
    choicesEl.appendChild(btn);
  });
}

function handleAnswer(chosen, btn, correct) {
  if (answered) return;
  answered = true;

  const allBtns = choicesEl.querySelectorAll('.choice-btn');

  if (chosen.name === correct.name) {
    // Correct!
    playSound('right');
    btn.classList.add('correct');
    streak++;
    const bonus = streak >= 3 ? 20 : 10;
    score += bonus;
    scoreEl.textContent = score;
    streakEl.textContent = streak;
    feedbackEl.textContent = streak >= 3
      ? `🔥 ${streak} in a row! +${bonus} points!`
      : `✅ Correct! +${bonus} points!`;
    feedbackEl.className = 'feedback-msg correct';
  } else {
    // Wrong
    playSound('wrong');
    btn.classList.add('wrong');
    streak = 0;
    streakEl.textContent = 0;
    // Highlight correct answer
    allBtns.forEach(b => {
      const name = b.querySelector('.choice-name').textContent;
      if (name === correct.name) b.classList.add('correct');
    });
    feedbackEl.textContent = `❌ It was ${correct.emoji} ${correct.name}!`;
    feedbackEl.className = 'feedback-msg wrong';
  }

  // Disable all buttons
  allBtns.forEach(b => b.disabled = true);

  // Advance after delay
  setTimeout(() => {
    currentQ++;
    if (currentQ >= TOTAL_QUESTIONS) {
      endGame();
    } else {
      renderQuestion();
    }
  }, 1400);
}

function endGame() {
  playSound('win');
  const stars = calcStars(score, [60, 120, 170]);

  saveProgress(GAME_ID, { score, stars });

  const ratio = score / 200;
  let emoji = '🌟';
  let title = 'Amazing Animal Expert!';
  if (ratio < 0.4) { emoji = '🐣'; title = 'Keep Practicing!'; }
  else if (ratio < 0.7) { emoji = '🦋'; title = 'Good Job!'; }

  document.getElementById('win-emoji').textContent = emoji;
  document.getElementById('win-title').textContent = title;
  document.getElementById('win-message').textContent =
    `You scored ${score} points in ${TOTAL_QUESTIONS} questions!`;
  document.getElementById('win-stars').innerHTML = starsHtml(stars);
  showOverlay('win-overlay');
}

function startGame() {
  hideAllOverlays();
  questions = buildQuestions();
  currentQ = 0;
  score = 0;
  streak = 0;
  scoreEl.textContent = '0';
  streakEl.textContent = '0';
  renderQuestion();
}

document.getElementById('btn-start').addEventListener('click', () => {
  hideOverlay('start-overlay');
  startGame();
});

document.getElementById('btn-play-again').addEventListener('click', startGame);
