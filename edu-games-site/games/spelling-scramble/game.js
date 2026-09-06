const GAME_ID = 'spelling-scramble';

const WORDS = [
  { word: 'dog', hint: 'A furry pet that barks' },
  { word: 'sun', hint: 'It shines in the sky' },
  { word: 'book', hint: 'You read this' },
  { word: 'fish', hint: 'It swims in water' },
  { word: 'tree', hint: 'It has leaves and a trunk' },
];

let wordIndex = 0;
let score = 0;
let order = [];

const scrambleEl = document.getElementById('scramble');
const hintEl = document.getElementById('word-hint');
const inputEl = document.getElementById('answer-input');
const wordNumEl = document.getElementById('word-num');
const scoreEl = document.getElementById('score');
const hintsEl = document.getElementById('letter-hints');

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function showWord() {
  const { word, hint } = WORDS[wordIndex];
  order = shuffle(word.split(''));
  scrambleEl.textContent = order.join(' ').toUpperCase();
  hintEl.textContent = 'Hint: ' + hint;
  wordNumEl.textContent = wordIndex + 1;
  inputEl.value = '';
  inputEl.className = 'answer-input';
  inputEl.focus();

  hintsEl.innerHTML = '';
  order.forEach(letter => {
    const chip = document.createElement('button');
    chip.className = 'letter-chip';
    chip.textContent = letter.toUpperCase();
    chip.addEventListener('click', () => {
      inputEl.value += letter;
      playSound('click');
    });
    hintsEl.appendChild(chip);
  });
}

function checkAnswer() {
  const answer = inputEl.value.trim().toLowerCase();
  const correct = WORDS[wordIndex].word;

  if (answer === correct) {
    playSound('match');
    inputEl.classList.add('correct');
    score += 20;
    scoreEl.textContent = score;
    wordIndex++;
    if (wordIndex >= WORDS.length) {
      setTimeout(endGame, 600);
    } else {
      setTimeout(showWord, 700);
    }
  } else {
    playSound('lose');
    inputEl.classList.add('wrong');
    setTimeout(() => inputEl.classList.remove('wrong'), 500);
  }
}

function endGame() {
  playSound('win');
  const stars = calcStars(score, [60, 80, 100]);
  saveProgress(GAME_ID, { score, stars });
  document.getElementById('win-message').textContent =
    `You spelled ${WORDS.length} words! Score: ${score}`;
  document.getElementById('win-stars').innerHTML = starsHtml(stars);
  showOverlay('win-overlay');
}

function resetGame() {
  hideAllOverlays();
  wordIndex = 0;
  score = 0;
  scoreEl.textContent = '0';
  showWord();
}

document.getElementById('btn-start').addEventListener('click', () => {
  hideOverlay('start-overlay');
  resetGame();
});

document.getElementById('btn-play-again').addEventListener('click', resetGame);
document.getElementById('btn-check').addEventListener('click', checkAnswer);
inputEl.addEventListener('keydown', e => {
  if (e.key === 'Enter') checkAnswer();
});
