// Canvas setup
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Game constants
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 40;
const BULLET_WIDTH = 4;
const BULLET_HEIGHT = 15;
const ENEMY_WIDTH = 40;
const ENEMY_HEIGHT = 30;
const POWERUP_SIZE = 25;

// Game state
let score = 0;
let highScore = parseInt(localStorage.getItem('shooting_highScore')) || 0;
let level = 1;
let lives = 3;
let gameOver = false;
let paused = false;
let gameStarted = false;
let animationId = null;

// Game objects
let player = null;
let bullets = [];
let enemies = [];
let enemyBullets = [];
let powerUps = [];
let stars = [];
let particles = [];

// Power-up states
let hasShield = false;
let shieldTimer = 0;
let speedBoost = false;
let speedTimer = 0;
let powerShot = false;
let powerTimer = 0;

// Input
const keys = {};

// DOM elements
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('high-score');
const levelDisplay = document.getElementById('level');
const livesDisplay = document.getElementById('lives');
const gameOverlay = document.getElementById('game-overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayMessage = document.getElementById('overlay-message');
const startBtn = document.getElementById('start-btn');

// Initialize display
highScoreDisplay.textContent = highScore;

// Player class
class Player {
    constructor() {
        this.width = PLAYER_WIDTH;
        this.height = PLAYER_HEIGHT;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - 20;
        this.speed = 6;
        this.shootCooldown = 0;
    }

    update() {
        const currentSpeed = speedBoost ? this.speed * 1.5 : this.speed;

        if (keys['ArrowLeft'] && this.x > 0) {
            this.x -= currentSpeed;
        }
        if (keys['ArrowRight'] && this.x < canvas.width - this.width) {
            this.x += currentSpeed;
        }

        if (this.shootCooldown > 0) this.shootCooldown--;
    }

    draw() {
        // Draw shield if active
        if (hasShield) {
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 35, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 217, 255, 0.5)';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // Ship body
        ctx.fillStyle = '#00d9ff';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height - 10);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        // Cockpit
        ctx.fillStyle = '#00ff88';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + 15, 8, 0, Math.PI * 2);
        ctx.fill();

        // Engine glow
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.moveTo(this.x + 10, this.y + this.height);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height + 10 + Math.random() * 5);
        ctx.lineTo(this.x + this.width - 10, this.y + this.height);
        ctx.closePath();
        ctx.fill();
    }

    shoot() {
        if (this.shootCooldown > 0) return;

        const bulletSpeed = powerShot ? 12 : 8;
        const cooldown = powerShot ? 8 : 15;

        bullets.push(new Bullet(
            this.x + this.width / 2 - BULLET_WIDTH / 2,
            this.y,
            bulletSpeed,
            powerShot
        ));

        if (powerShot) {
            bullets.push(new Bullet(this.x + 5, this.y + 10, bulletSpeed, true));
            bullets.push(new Bullet(this.x + this.width - 5 - BULLET_WIDTH, this.y + 10, bulletSpeed, true));
        }

        this.shootCooldown = cooldown;
    }
}

// Bullet class
class Bullet {
    constructor(x, y, speed, isPowerShot = false) {
        this.x = x;
        this.y = y;
        this.width = isPowerShot ? 6 : BULLET_WIDTH;
        this.height = BULLET_HEIGHT;
        this.speed = speed;
        this.isPowerShot = isPowerShot;
    }

    update() {
        this.y -= this.speed;
    }

    draw() {
        ctx.fillStyle = this.isPowerShot ? '#ff6600' : '#00ff88';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.isPowerShot ? '#ff6600' : '#00ff88';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }
}

// Enemy class
class Enemy {
    constructor(x, y, type = 1) {
        this.x = x;
        this.y = y;
        this.width = ENEMY_WIDTH;
        this.height = ENEMY_HEIGHT;
        this.type = type;
        this.speed = 1 + level * 0.3;
        this.direction = 1;
        this.shootChance = 0.005 + level * 0.002;
        this.health = type;
    }

    update() {
        this.x += this.speed * this.direction;

        if (Math.random() < this.shootChance) {
            this.shoot();
        }
    }

    draw() {
        const colors = ['#ff4444', '#ff8844', '#ffaa44'];
        ctx.fillStyle = colors[this.type - 1] || colors[0];

        // Enemy body
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y + this.height);
        ctx.lineTo(this.x + this.width, this.y + 5);
        ctx.lineTo(this.x + this.width - 5, this.y);
        ctx.lineTo(this.x + 5, this.y);
        ctx.lineTo(this.x, this.y + 5);
        ctx.closePath();
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x + 12, this.y + 12, 5, 0, Math.PI * 2);
        ctx.arc(this.x + this.width - 12, this.y + 12, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + 12, this.y + 12, 2, 0, Math.PI * 2);
        ctx.arc(this.x + this.width - 12, this.y + 12, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    shoot() {
        enemyBullets.push({
            x: this.x + this.width / 2 - 3,
            y: this.y + this.height,
            width: 6,
            height: 12,
            speed: 4 + level * 0.5
        });
    }
}

// PowerUp class
class PowerUp {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = POWERUP_SIZE;
        this.speed = 2;
        this.type = Math.floor(Math.random() * 3); // 0: shield, 1: speed, 2: power
        this.symbols = ['🛡️', '⚡', '🔥'];
    }

    update() {
        this.y += this.speed;
    }

    draw() {
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.symbols[this.type], this.x + this.size / 2, this.y + this.size / 2);
    }
}

// Particle class
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = (Math.random() - 0.5) * 6;
        this.life = 30;
        this.color = color;
        this.size = Math.random() * 4 + 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        this.size *= 0.95;
    }

    draw() {
        ctx.globalAlpha = this.life / 30;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// Create stars background
function createStars() {
    stars = [];
    for (let i = 0; i < 100; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 2 + 0.5
        });
    }
}

// Spawn enemies
function spawnEnemies() {
    const rows = Math.min(3 + Math.floor(level / 2), 5);
    const cols = Math.min(6 + Math.floor(level / 3), 8);
    const padding = 10;
    const startX = (canvas.width - cols * (ENEMY_WIDTH + padding)) / 2;

    for (let row = 0; row < rows; row++) {
        const type = rows - row;
        for (let col = 0; col < cols; col++) {
            enemies.push(new Enemy(
                startX + col * (ENEMY_WIDTH + padding),
                50 + row * (ENEMY_HEIGHT + padding),
                Math.min(type, 3)
            ));
        }
    }
}

// Create explosion
function createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(x, y, color));
    }
}

// Collision detection
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Update game
function update() {
    // Update player
    player.update();

    // Update bullets
    bullets = bullets.filter(bullet => {
        bullet.update();
        return bullet.y > -bullet.height;
    });

    // Update enemy bullets
    enemyBullets = enemyBullets.filter(bullet => {
        bullet.y += bullet.speed;
        return bullet.y < canvas.height;
    });

    // Update enemies
    let shouldReverse = false;
    enemies.forEach(enemy => {
        enemy.update();
        if (enemy.x <= 0 || enemy.x + enemy.width >= canvas.width) {
            shouldReverse = true;
        }
    });

    if (shouldReverse) {
        enemies.forEach(enemy => {
            enemy.direction *= -1;
            enemy.y += 20;
        });
    }

    // Update power-ups
    powerUps = powerUps.filter(powerUp => {
        powerUp.update();
        return powerUp.y < canvas.height;
    });

    // Update particles
    particles = particles.filter(particle => {
        particle.update();
        return particle.life > 0;
    });

    // Update stars
    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    });

    // Update power-up timers
    if (hasShield) {
        shieldTimer--;
        if (shieldTimer <= 0) hasShield = false;
    }
    if (speedBoost) {
        speedTimer--;
        if (speedTimer <= 0) speedBoost = false;
    }
    if (powerShot) {
        powerTimer--;
        if (powerTimer <= 0) powerShot = false;
    }

    // Check bullet-enemy collisions
    bullets.forEach((bullet, bi) => {
        enemies.forEach((enemy, ei) => {
            if (checkCollision(bullet, enemy)) {
                bullets.splice(bi, 1);
                enemy.health--;

                if (enemy.health <= 0) {
                    createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ff6600');
                    enemies.splice(ei, 1);
                    score += enemy.type * 10 * level;

                    // Chance to drop power-up
                    if (Math.random() < 0.1) {
                        powerUps.push(new PowerUp(enemy.x, enemy.y));
                    }
                }
            }
        });
    });

    // Check enemy bullet-player collisions
    enemyBullets.forEach((bullet, bi) => {
        if (checkCollision(bullet, player)) {
            enemyBullets.splice(bi, 1);

            if (hasShield) {
                hasShield = false;
                createExplosion(player.x + player.width / 2, player.y, '#00d9ff');
            } else {
                lives--;
                updateLives();
                createExplosion(player.x + player.width / 2, player.y + player.height / 2, '#ff0000');

                if (lives <= 0) {
                    endGame();
                }
            }
        }
    });

    // Check enemy-player collision
    enemies.forEach(enemy => {
        if (checkCollision(enemy, player)) {
            if (!hasShield) {
                endGame();
            }
        }

        // Enemy reached bottom
        if (enemy.y + enemy.height > canvas.height - 50) {
            endGame();
        }
    });

    // Check power-up collection
    powerUps.forEach((powerUp, pi) => {
        if (checkCollision(powerUp, { x: player.x, y: player.y, width: player.width, height: player.height })) {
            powerUps.splice(pi, 1);

            switch (powerUp.type) {
                case 0: // Shield
                    hasShield = true;
                    shieldTimer = 300;
                    break;
                case 1: // Speed
                    speedBoost = true;
                    speedTimer = 300;
                    break;
                case 2: // Power shot
                    powerShot = true;
                    powerTimer = 300;
                    break;
            }
        }
    });

    // Level complete
    if (enemies.length === 0) {
        level++;
        levelDisplay.textContent = level;
        spawnEnemies();
    }

    // Update score display
    scoreDisplay.textContent = score;

    if (score > highScore) {
        highScore = score;
        highScoreDisplay.textContent = highScore;
        localStorage.setItem('shooting_highScore', highScore);
    }
}

// Draw game
function draw() {
    // Clear canvas
    ctx.fillStyle = '#0a0a20';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars
    ctx.fillStyle = '#fff';
    stars.forEach(star => {
        ctx.globalAlpha = 0.5 + Math.random() * 0.5;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw particles
    particles.forEach(p => p.draw());

    // Draw power-ups
    powerUps.forEach(p => p.draw());

    // Draw bullets
    bullets.forEach(b => b.draw());

    // Draw enemy bullets
    ctx.fillStyle = '#ff4444';
    enemyBullets.forEach(b => {
        ctx.fillRect(b.x, b.y, b.width, b.height);
    });

    // Draw enemies
    enemies.forEach(e => e.draw());

    // Draw player
    player.draw();
}

// Game loop
function gameLoop() {
    if (gameOver || paused) return;

    update();
    draw();

    animationId = requestAnimationFrame(gameLoop);
}

// Update lives display
function updateLives() {
    livesDisplay.textContent = '❤️'.repeat(lives);
}

// Start game
function startGame() {
    score = 0;
    level = 1;
    lives = 3;
    gameOver = false;
    paused = false;
    gameStarted = true;

    bullets = [];
    enemies = [];
    enemyBullets = [];
    powerUps = [];
    particles = [];

    hasShield = false;
    speedBoost = false;
    powerShot = false;

    player = new Player();
    createStars();
    spawnEnemies();

    scoreDisplay.textContent = '0';
    levelDisplay.textContent = '1';
    updateLives();

    gameOverlay.classList.add('hidden');
    animationId = requestAnimationFrame(gameLoop);
}

// End game
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

// Toggle pause
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
        animationId = requestAnimationFrame(gameLoop);
    }
}

// Event listeners
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;

    if (!gameStarted && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault();
        startGame();
        return;
    }

    if (e.code === 'KeyP') {
        togglePause();
        return;
    }

    if (e.code === 'Space' && gameStarted && !paused && !gameOver) {
        e.preventDefault();
        player.shoot();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

startBtn.addEventListener('click', () => {
    if (paused) {
        togglePause();
    } else {
        startGame();
    }
});

// Initial draw
createStars();
draw();
