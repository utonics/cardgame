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

// Initialize game
function initGame() {
    // Reset state
    cards = [];
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    isLocked = false;
    gameStarted = false;

    // Reset timer
    stopTimer();
    seconds = 0;
    timerDisplay.textContent = '00:00';

    // Get current difficulty settings
    const settings = difficultySettings[currentDifficulty];
    const cardSymbols = allSymbols.slice(0, settings.pairs);

    // Update display
    movesDisplay.textContent = '0';
    matchedDisplay.textContent = '0';
    totalDisplay.textContent = settings.pairs;
    winModal.classList.remove('show');

    // Update grid class
    gameBoard.className = 'game-board ' + settings.gridClass;

    // Create card pairs
    const cardPairs = [...cardSymbols, ...cardSymbols];

    // Shuffle cards
    shuffleArray(cardPairs);

    // Clear board
    gameBoard.innerHTML = '';

    // Create card elements
    cardPairs.forEach((symbol, index) => {
        const card = createCardElement(symbol, index);
        gameBoard.appendChild(card);
        cards.push({
            element: card,
            symbol: symbol,
            isFlipped: false,
            isMatched: false
        });
    });
}

// Create card DOM element
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

// Shuffle array (Fisher-Yates algorithm)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Handle card click
function handleCardClick(index) {
    const card = cards[index];

    // Ignore if locked, already flipped, or already matched
    if (isLocked || card.isFlipped || card.isMatched) {
        return;
    }

    // Start timer on first card click
    if (!gameStarted) {
        gameStarted = true;
        startTimer();
    }

    // Flip card
    flipCard(index);

    // Add to flipped cards
    flippedCards.push(index);

    // Check for match when two cards are flipped
    if (flippedCards.length === 2) {
        moves++;
        movesDisplay.textContent = moves;
        checkForMatch();
    }
}

// Flip card
function flipCard(index) {
    cards[index].isFlipped = true;
    cards[index].element.classList.add('flipped');
}

// Unflip card
function unflipCard(index) {
    cards[index].isFlipped = false;
    cards[index].element.classList.remove('flipped');
}

// Check for match
function checkForMatch() {
    const [firstIndex, secondIndex] = flippedCards;
    const firstCard = cards[firstIndex];
    const secondCard = cards[secondIndex];

    if (firstCard.symbol === secondCard.symbol) {
        // Match found
        handleMatch(firstIndex, secondIndex);
    } else {
        // No match
        handleMismatch(firstIndex, secondIndex);
    }
}

// Handle match
function handleMatch(firstIndex, secondIndex) {
    cards[firstIndex].isMatched = true;
    cards[secondIndex].isMatched = true;

    cards[firstIndex].element.classList.add('matched');
    cards[secondIndex].element.classList.add('matched');

    matchedPairs++;
    matchedDisplay.textContent = matchedPairs;

    flippedCards = [];

    // Check for win
    const settings = difficultySettings[currentDifficulty];
    if (matchedPairs === settings.pairs) {
        setTimeout(showWinModal, 500);
    }
}

// Handle mismatch
function handleMismatch(firstIndex, secondIndex) {
    isLocked = true;

    setTimeout(() => {
        unflipCard(firstIndex);
        unflipCard(secondIndex);
        flippedCards = [];
        isLocked = false;
    }, 1000);
}

// Show win modal
function showWinModal() {
    stopTimer();
    finalTimeDisplay.textContent = formatTime(seconds);
    finalMovesDisplay.textContent = moves;
    winModal.classList.add('show');
}

// Timer functions
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

// Event listeners
restartBtn.addEventListener('click', initGame);
playAgainBtn.addEventListener('click', initGame);

// Difficulty button listeners
diffButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Update active button
        diffButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Set difficulty and restart game
        currentDifficulty = btn.dataset.difficulty;
        initGame();
    });
});

// Start game
initGame();
