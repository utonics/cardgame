// Canvas setup
const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-piece');
const nextCtx = nextCanvas.getContext('2d');

// Game constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = canvas.width / COLS;
const NEXT_BLOCK_SIZE = 25;

// Colors for tetrominos
const COLORS = [
    null,
    '#00f0f0', // I - cyan
    '#0000f0', // J - blue
    '#f0a000', // L - orange
    '#f0f000', // O - yellow
    '#00f000', // S - green
    '#a000f0', // T - purple
    '#f00000'  // Z - red
];

// Tetromino shapes
const SHAPES = [
    null,
    [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], // I
    [[2,0,0], [2,2,2], [0,0,0]],                   // J
    [[0,0,3], [3,3,3], [0,0,0]],                   // L
    [[4,4], [4,4]],                                 // O
    [[0,5,5], [5,5,0], [0,0,0]],                   // S
    [[0,6,0], [6,6,6], [0,0,0]],                   // T
    [[7,7,0], [0,7,7], [0,0,0]]                    // Z
];

// Game state
let board = [];
let score = 0;
let highScore = parseInt(localStorage.getItem('tetris_highScore')) || 0;
let level = 1;
let lines = 0;
let gameOver = false;
let paused = false;
let gameStarted = false;
let currentPiece = null;
let nextPiece = null;
let dropInterval = 1000;
let lastDrop = 0;
let animationId = null;

// DOM elements
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('high-score');
const levelDisplay = document.getElementById('level');
const linesDisplay = document.getElementById('lines');
const gameOverlay = document.getElementById('game-overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayMessage = document.getElementById('overlay-message');
const startBtn = document.getElementById('start-btn');

// Initialize
highScoreDisplay.textContent = highScore;

// Piece class
class Piece {
    constructor(shape) {
        this.shape = shape || SHAPES[Math.floor(Math.random() * 7) + 1];
        this.color = this.shape[0].find(cell => cell > 0) ||
                     this.shape[1].find(cell => cell > 0) ||
                     this.shape.flat().find(cell => cell > 0);
        this.x = Math.floor((COLS - this.shape[0].length) / 2);
        this.y = 0;
    }

    rotate() {
        const rows = this.shape.length;
        const cols = this.shape[0].length;
        const rotated = [];

        for (let i = 0; i < cols; i++) {
            rotated[i] = [];
            for (let j = rows - 1; j >= 0; j--) {
                rotated[i][rows - 1 - j] = this.shape[j][i];
            }
        }
        return rotated;
    }
}

// Create empty board
function createBoard() {
    board = [];
    for (let row = 0; row < ROWS; row++) {
        board[row] = new Array(COLS).fill(0);
    }
}

// Draw functions
function drawBlock(ctx, x, y, color, size = BLOCK_SIZE) {
    const padding = 1;
    ctx.fillStyle = color;
    ctx.fillRect(x * size + padding, y * size + padding, size - padding * 2, size - padding * 2);

    // Add shine effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(x * size + padding, y * size + padding, size - padding * 2, (size - padding * 2) / 4);
}

function drawBoard() {
    ctx.fillStyle = '#0a0a15';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= COLS; i++) {
        ctx.beginPath();
        ctx.moveTo(i * BLOCK_SIZE, 0);
        ctx.lineTo(i * BLOCK_SIZE, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i <= ROWS; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * BLOCK_SIZE);
        ctx.lineTo(canvas.width, i * BLOCK_SIZE);
        ctx.stroke();
    }

    // Draw placed blocks
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col]) {
                drawBlock(ctx, col, row, COLORS[board[row][col]]);
            }
        }
    }
}

function drawPiece() {
    if (!currentPiece) return;

    // Draw ghost piece
    const ghostY = getGhostY();
    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.fillRect(
                    (currentPiece.x + x) * BLOCK_SIZE + 1,
                    (ghostY + y) * BLOCK_SIZE + 1,
                    BLOCK_SIZE - 2,
                    BLOCK_SIZE - 2
                );
            }
        });
    });

    // Draw current piece
    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                drawBlock(ctx, currentPiece.x + x, currentPiece.y + y, COLORS[value]);
            }
        });
    });
}

function drawNextPiece() {
    nextCtx.fillStyle = '#0a0a15';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

    if (!nextPiece) return;

    const offsetX = (nextCanvas.width - nextPiece.shape[0].length * NEXT_BLOCK_SIZE) / 2;
    const offsetY = (nextCanvas.height - nextPiece.shape.length * NEXT_BLOCK_SIZE) / 2;

    nextPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                const px = offsetX / NEXT_BLOCK_SIZE + x;
                const py = offsetY / NEXT_BLOCK_SIZE + y;
                drawBlock(nextCtx, px, py, COLORS[value], NEXT_BLOCK_SIZE);
            }
        });
    });
}

// Collision detection
function isValidMove(piece, offsetX = 0, offsetY = 0, newShape = null) {
    const shape = newShape || piece.shape;

    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const newX = piece.x + x + offsetX;
                const newY = piece.y + y + offsetY;

                if (newX < 0 || newX >= COLS || newY >= ROWS) {
                    return false;
                }
                if (newY >= 0 && board[newY][newX]) {
                    return false;
                }
            }
        }
    }
    return true;
}

function getGhostY() {
    let ghostY = currentPiece.y;
    while (isValidMove(currentPiece, 0, ghostY - currentPiece.y + 1)) {
        ghostY++;
    }
    return ghostY;
}

// Game mechanics
function lockPiece() {
    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                const boardY = currentPiece.y + y;
                if (boardY >= 0) {
                    board[boardY][currentPiece.x + x] = value;
                }
            }
        });
    });

    clearLines();
    spawnPiece();
}

function clearLines() {
    let clearedLines = 0;

    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row].every(cell => cell !== 0)) {
            board.splice(row, 1);
            board.unshift(new Array(COLS).fill(0));
            clearedLines++;
            row++;
        }
    }

    if (clearedLines > 0) {
        const points = [0, 100, 300, 500, 800];
        score += points[clearedLines] * level;
        lines += clearedLines;

        // Level up every 10 lines
        const newLevel = Math.floor(lines / 10) + 1;
        if (newLevel > level) {
            level = newLevel;
            dropInterval = Math.max(100, 1000 - (level - 1) * 100);
        }

        updateDisplay();
    }
}

function spawnPiece() {
    currentPiece = nextPiece || new Piece(SHAPES[Math.floor(Math.random() * 7) + 1]);
    nextPiece = new Piece(SHAPES[Math.floor(Math.random() * 7) + 1]);
    drawNextPiece();

    if (!isValidMove(currentPiece)) {
        endGame();
    }
}

function updateDisplay() {
    scoreDisplay.textContent = score;
    levelDisplay.textContent = level;
    linesDisplay.textContent = lines;

    if (score > highScore) {
        highScore = score;
        highScoreDisplay.textContent = highScore;
        localStorage.setItem('tetris_highScore', highScore);
    }
}

// Controls
function moveLeft() {
    if (isValidMove(currentPiece, -1, 0)) {
        currentPiece.x--;
    }
}

function moveRight() {
    if (isValidMove(currentPiece, 1, 0)) {
        currentPiece.x++;
    }
}

function moveDown() {
    if (isValidMove(currentPiece, 0, 1)) {
        currentPiece.y++;
        return true;
    }
    return false;
}

function rotatePiece() {
    const rotated = currentPiece.rotate();

    // Wall kick - try to fit rotated piece
    const kicks = [0, -1, 1, -2, 2];
    for (const kick of kicks) {
        if (isValidMove(currentPiece, kick, 0, rotated)) {
            currentPiece.shape = rotated;
            currentPiece.x += kick;
            return;
        }
    }
}

function hardDrop() {
    while (moveDown()) {
        score += 2;
    }
    lockPiece();
    updateDisplay();
}

// Game loop
function gameLoop(timestamp) {
    if (gameOver || paused) return;

    if (timestamp - lastDrop > dropInterval) {
        if (!moveDown()) {
            lockPiece();
        }
        lastDrop = timestamp;
    }

    drawBoard();
    drawPiece();

    animationId = requestAnimationFrame(gameLoop);
}

// Game control
function startGame() {
    createBoard();
    score = 0;
    level = 1;
    lines = 0;
    dropInterval = 1000;
    gameOver = false;
    paused = false;
    gameStarted = true;

    updateDisplay();
    spawnPiece();
    drawNextPiece();

    gameOverlay.classList.add('hidden');
    lastDrop = performance.now();
    animationId = requestAnimationFrame(gameLoop);
}

function endGame() {
    gameOver = true;
    gameStarted = false;

    if (animationId) {
        cancelAnimationFrame(animationId);
    }

    overlayTitle.textContent = '게임 오버';
    overlayMessage.textContent = `최종 점수: ${score}`;
    startBtn.textContent = '다시 시작';
    gameOverlay.classList.remove('hidden');
}

function togglePause() {
    if (!gameStarted || gameOver) return;

    paused = !paused;

    if (paused) {
        overlayTitle.textContent = '일시정지';
        overlayMessage.textContent = 'P를 눌러 계속';
        startBtn.textContent = '계속하기';
        gameOverlay.classList.remove('hidden');
    } else {
        gameOverlay.classList.add('hidden');
        lastDrop = performance.now();
        animationId = requestAnimationFrame(gameLoop);
    }
}

// Event listeners
document.addEventListener('keydown', (e) => {
    if (!gameStarted && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault();
        startGame();
        return;
    }

    if (gameOver) return;

    if (e.code === 'KeyP') {
        togglePause();
        return;
    }

    if (paused) return;

    switch (e.code) {
        case 'ArrowLeft':
            e.preventDefault();
            moveLeft();
            break;
        case 'ArrowRight':
            e.preventDefault();
            moveRight();
            break;
        case 'ArrowDown':
            e.preventDefault();
            if (moveDown()) score += 1;
            updateDisplay();
            break;
        case 'ArrowUp':
            e.preventDefault();
            rotatePiece();
            break;
        case 'Space':
            e.preventDefault();
            hardDrop();
            break;
    }

    drawBoard();
    drawPiece();
});

startBtn.addEventListener('click', () => {
    if (paused) {
        togglePause();
    } else {
        startGame();
    }
});

// Initial draw
drawBoard();
drawNextPiece();
