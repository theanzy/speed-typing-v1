const RANDOM_QUOTE_API_URL = 'https://staging.quotable.io/random';

const quoteDisplayElement = document.querySelector('#quoteDisplay');
const quoteInputElement = document.querySelector('#quoteInput');
const timerElement = document.getElementById('timer');
const scoreDisplayElement = document.querySelector('.score-display');
let timerInterval;

const TIMEOUT_SECONDS = 60;
const NUMBER_OF_QUOTES = 1;
document.addEventListener('gameover', handleGameOver);

const restartBtn = document.getElementById('restartBtn');
restartBtn.addEventListener('click', startGame);

function handleGameOver() {
  quoteInputElement.removeEventListener('input', handleTyping);
  quoteInputElement.disabled = true;
  clearInterval(timerInterval);

  const [minutes, seconds] = timerElement.innerText.split(':');
  const totalSecondsRemaining = minutes * 60 + seconds;
  const totalElapsedSeconds = TIMEOUT_SECONDS - totalSecondsRemaining;
  const totalElapsedMinutes = totalElapsedSeconds / 60;
  // wpm gross
  const wordSpans = quoteDisplayElement.querySelectorAll(
    '.correct, .incorrect'
  );
  const correctSpans = quoteDisplayElement.querySelectorAll('.correct');
  const totalWordCount = wordSpans.length;
  const grossWPM = Math.floor(totalWordCount / totalElapsedMinutes);
  // accuracy
  const accuracy = (correctSpans.length / wordSpans.length) * 100;
  // typos
  const typos = totalWordCount - correctSpans.length;
  // wpm net
  const netWPM = Math.floor((grossWPM * accuracy) / 100);
  scoreDisplayElement.style.visibility = 'visible';
  scoreDisplayElement.style.opacity = '1';
  document.getElementById('scoreTypingSpeed').textContent = `${grossWPM}`;
  document.getElementById('scoreAccuracy').textContent = `${accuracy.toFixed(
    2
  )}`;
  document.getElementById('scoreTypos').textContent = `${typos}`;
  document.getElementById('scoreNetSpeed').textContent = `${netWPM}`;
}

function handleTyping() {
  const displayTokens = quoteDisplayElement.querySelectorAll('span');
  const inputTokens = quoteInputElement.value.split(/(\s)/);
  const lastInputToken = inputTokens[inputTokens.length - 1];
  if (lastInputToken === '') {
    inputTokens.pop();
  }
  const currentIndex = inputTokens.length - 1;
  currentToken = displayTokens[currentIndex];
  if (currentToken != null || currentToken != undefined) {
    const spanBottom =
      displayTokens[currentIndex].offsetTop +
      displayTokens[currentIndex].offsetHeight;
    const spanTop = displayTokens[currentIndex].offsetTop;
    // need to offset bottm
    if (
      spanBottom >
        quoteDisplayElement.clientHeight -
          displayTokens[currentIndex].offsetHeight ||
      spanTop < quoteDisplayElement.scrollTop
    ) {
      displayTokens[currentIndex].scrollIntoView();
    }
    if (displayTokens[currentIndex].textContent !== ' ') {
      displayTokens[currentIndex].classList.add('current');
    }
  }
  displayTokens.forEach((span, index) => {
    // a blank space is also a word
    const word = inputTokens[index];
    if (index > currentIndex) {
      span.classList.remove('current');
      span.classList.remove('correct');
      span.classList.remove('incorrect');
    } else if (
      word == null ||
      word == undefined ||
      word === ' ' ||
      index === inputTokens.length - 1
    ) {
      span.classList.remove('incorrect');
      span.classList.remove('correct');
    } else if (word === span.innerText) {
      span.classList.add('correct');
      span.classList.remove('incorrect');
      span.classList.remove('current');
    } else {
      span.classList.add('incorrect');
      span.classList.remove('correct');
      span.classList.remove('current');
    }
  });

  if (inputTokens.length > displayTokens.length) {
    document.dispatchEvent(new Event('gameover'));
  }
}

function getRandomQuote() {
  return fetch(RANDOM_QUOTE_API_URL, {
    method: 'get',
    mode: 'cors',
  })
    .then((res) => res.json())
    .then((data) => data.content);
}

function getRandomQuotes(n) {
  const promises = [];
  for (let i = 0; i < n; i++) {
    promises.push(getRandomQuote());
  }
  return Promise.all(promises).then((values) => {
    return values.join(' ');
  });
}

function renderNewQuote(n) {
  return getRandomQuotes(n).then((quote) => {
    const tokens = quote.split(' ');
    quoteDisplayElement.innerHTML = '';
    tokens.forEach((word, i) => {
      quoteDisplayElement.appendChild(createTextElement('span', word));
      if (i !== tokens.length - 1) {
        quoteDisplayElement.appendChild(createTextElement('span', ' '));
      }
    });
  });
}

function createTextElement(name, innerText) {
  const elem = document.createElement(name);
  elem.innerText = innerText;
  return elem;
}

function startTimeout(timeoutSeconds) {
  timerElement.innerText = 0;
  const finish = secondsInFuture(timeoutSeconds);
  return new Promise((resolve) => {
    timerInterval = setInterval(() => {
      const now = new Date().getTime();
      const distance = finish - now;
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      timerElement.innerText = getDisplayTime(minutes, seconds);
      if (distance < 0) {
        clearInterval(timerInterval);
        resolve();
      }
    }, 100);
  });
}

function secondsInFuture(seconds) {
  const result = new Date();
  result.setSeconds(result.getSeconds() + seconds);
  return result;
}

function zeropad(num, size) {
  return ('00' + num).substr(-size);
}
function getDisplayTime(minute, second) {
  minute = Math.max(0, minute);
  second = Math.max(0, second);
  return `${zeropad(minute, 2)}:${zeropad(second, 2)}`;
}

function toMinutesAndSeconds(seconds) {
  minutes = Math.floor(seconds / 60);
  seconds = seconds % 60;
  return { minutes, seconds };
}

function startTimer() {
  startTimeout(TIMEOUT_SECONDS).then(handleGameOver);
}

function startGame() {
  scoreDisplayElement.style.visibility = 'hidden';
  scoreDisplayElement.style.opacity = '0';
  renderNewQuote(NUMBER_OF_QUOTES).then(() => {
    quoteInputElement.disabled = false;
    quoteInputElement.focus();
    quoteInputElement.value = null;
    // timer
    const timeout = toMinutesAndSeconds(TIMEOUT_SECONDS);
    timerElement.innerText = getDisplayTime(timeout.minutes, timeout.seconds);
  });

  quoteInputElement.addEventListener('input', handleTyping);
  quoteInputElement.addEventListener('input', startTimer, {
    once: true,
  });
}

startGame();
