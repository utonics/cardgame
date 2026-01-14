// Card symbols (emoji pairs)
const cardSymbols = ['🎮', '🎲', '🎯', '🎪', '🎨', '🎭', '🎵', '🎸'];

// Game state
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let isLocked = false;

// DOM elements
const gameBoard = document.getElementById('game-board');
const movesDisplay = document.getElementById('moves');
const matchedDisplay = document.getElementById('matched');
const totalDisplay = document.getElementById('total');
const restartBtn = document.getElementById('restart-btn');
const winModal = document.getElementById('win-modal');
const finalMovesDisplay = document.getElementById('final-moves');
const playAgainBtn = document.getElementById('play-again-btn');

// Initialize game
function initGame() {
    // Reset state
    cards = [];
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    isLocked = false;

    // Update display
    movesDisplay.textContent = '0';
    matchedDisplay.textContent = '0';
    totalDisplay.textContent = cardSymbols.length;
    winModal.classList.remove('show');

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
    if (matchedPairs === cardSymbols.length) {
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
    finalMovesDisplay.textContent = moves;
    winModal.classList.add('show');
}

// Event listeners
restartBtn.addEventListener('click', initGame);
playAgainBtn.addEventListener('click', initGame);

// Start game
initGame();
