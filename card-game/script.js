// Card symbols (emoji pairs)
const allSymbols = ['🎮', '🎲', '🎯', '🎪', '🎨', '🎭', '🎵', '🎸', '🎺', '🎻', '🏀', '⚽'];

// Difficulty settings
const difficultySettings = {
    easy: { pairs: 4, gridClass: 'easy' },
    normal: { pairs: 8, gridClass: 'normal' },
    hard: { pairs: 12, gridClass: 'hard' }
};

let currentDifficulty = 'easy';

// Game state
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let isLocked = false;
let timerInterval = null;
let seconds = 0;
let gameStarted = false;

// DOM elements
const gameBoard = document.getElementById('game-board');
const movesDisplay = document.getElementById('moves');
const matchedDisplay = document.getElementById('matched');
const totalDisplay = document.getElementById('total');
const restartBtn = document.getElementById('restart-btn');
const winModal = document.getElementById('win-modal');
const finalMovesDisplay = document.getElementById('final-moves');
const playAgainBtn = document.getElementById('play-again-btn');
const timerDisplay = document.getElementById('timer');
const finalTimeDisplay = document.getElementById('final-time');
const diffButtons = document.querySelectorAll('.diff-btn');
const bestTimeDisplay = document.getElementById('best-time');
const bestMovesDisplay = document.getElementById('best-moves');
const newRecordDisplay = document.getElementById('new-record');

// Initialize game
function initGame() {
    cards = [];
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    isLocked = false;
    gameStarted = false;

    stopTimer();
    seconds = 0;
    timerDisplay.textContent = '00:00';

    const settings = difficultySettings[currentDifficulty];
    const cardSymbols = allSymbols.slice(0, settings.pairs);

    movesDisplay.textContent = '0';
    matchedDisplay.textContent = '0';
    totalDisplay.textContent = settings.pairs;
    winModal.classList.remove('show');
    newRecordDisplay.classList.remove('show');

    displayBestRecord();
    gameBoard.className = 'game-board ' + settings.gridClass;

    const cardPairs = [...cardSymbols, ...cardSymbols];
    shuffleArray(cardPairs);
    gameBoard.innerHTML = '';

    cardPairs.forEach((symbol, index) => {
        const card = createCardElement(symbol, index);
        gameBoard.appendChild(card);
        cards.push({ element: card, symbol, isFlipped: false, isMatched: false });
    });
}

function createCardElement(symbol, index) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.index = index;
    card.innerHTML = `
        <div class="card-face card-back"></div>
        <div class="card-face card-front">${symbol}</div>
    `;
    card.addEventListener('click', () => handleCardClick(index));
    return card;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function handleCardClick(index) {
    const card = cards[index];
    if (isLocked || card.isFlipped || card.isMatched) return;

    if (!gameStarted) {
        gameStarted = true;
        startTimer();
    }

    flipCard(index);
    flippedCards.push(index);

    if (flippedCards.length === 2) {
        moves++;
        movesDisplay.textContent = moves;
        checkForMatch();
    }
}

function flipCard(index) {
    cards[index].isFlipped = true;
    cards[index].element.classList.add('flipped');
}

function unflipCard(index) {
    cards[index].isFlipped = false;
    cards[index].element.classList.remove('flipped');
}

function checkForMatch() {
    const [firstIndex, secondIndex] = flippedCards;
    const firstCard = cards[firstIndex];
    const secondCard = cards[secondIndex];

    if (firstCard.symbol === secondCard.symbol) {
        handleMatch(firstIndex, secondIndex);
    } else {
        handleMismatch(firstIndex, secondIndex);
    }
}

function handleMatch(firstIndex, secondIndex) {
    cards[firstIndex].isMatched = true;
    cards[secondIndex].isMatched = true;
    cards[firstIndex].element.classList.add('matched');
    cards[secondIndex].element.classList.add('matched');

    matchedPairs++;
    matchedDisplay.textContent = matchedPairs;
    flippedCards = [];

    const settings = difficultySettings[currentDifficulty];
    if (matchedPairs === settings.pairs) {
        setTimeout(showWinModal, 500);
    }
}

function handleMismatch(firstIndex, secondIndex) {
    isLocked = true;
    setTimeout(() => {
        unflipCard(firstIndex);
        unflipCard(secondIndex);
        flippedCards = [];
        isLocked = false;
    }, 1000);
}

function showWinModal() {
    stopTimer();
    finalTimeDisplay.textContent = formatTime(seconds);
    finalMovesDisplay.textContent = moves;

    const isNewRecord = checkAndSaveBestRecord();
    if (isNewRecord) {
        newRecordDisplay.classList.add('show');
        displayBestRecord();
    } else {
        newRecordDisplay.classList.remove('show');
    }
    winModal.classList.add('show');
}

function startTimer() {
    timerInterval = setInterval(() => {
        seconds++;
        timerDisplay.textContent = formatTime(seconds);
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Best record functions
function getBestRecord() {
    const key = `cardGame_best_${currentDifficulty}`;
    const record = localStorage.getItem(key);
    return record ? JSON.parse(record) : null;
}

function saveBestRecord(time, moves) {
    const key = `cardGame_best_${currentDifficulty}`;
    localStorage.setItem(key, JSON.stringify({ time, moves }));
}

function checkAndSaveBestRecord() {
    const currentRecord = getBestRecord();
    if (!currentRecord) {
        saveBestRecord(seconds, moves);
        return true;
    }
    if (seconds < currentRecord.time || (seconds === currentRecord.time && moves < currentRecord.moves)) {
        saveBestRecord(seconds, moves);
        return true;
    }
    return false;
}

function displayBestRecord() {
    const record = getBestRecord();
    if (record) {
        bestTimeDisplay.textContent = formatTime(record.time);
        bestMovesDisplay.textContent = record.moves;
    } else {
        bestTimeDisplay.textContent = '--:--';
        bestMovesDisplay.textContent = '-';
    }
}

// Event listeners
restartBtn.addEventListener('click', initGame);
playAgainBtn.addEventListener('click', initGame);

diffButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        diffButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentDifficulty = btn.dataset.difficulty;
        initGame();
    });
});

initGame();
