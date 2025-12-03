// Get access to the Canvas, its context, and all menu elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Element references from index.html
const mainMenu = document.getElementById('main-menu');
const difficultyMenu = document.getElementById('difficulty-menu');
const settingsMenu = document.getElementById('settings-menu');
// 💥 НОВОЕ: Ссылка на меню Game Over
const gameOverMenu = document.getElementById('game-over-menu');
const finalScoreElement = document.getElementById('final-score');

const volumeSlider = document.getElementById('volume-slider');
const volumeValueSpan = document.getElementById('volume-value');

// Canvas Dimensions
const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;

// --- Load Images ---
const mochiImage = new Image();
mochiImage.src = 'Mochi.png'; 

const coinImage = new Image();
coinImage.src = 'gencoin.jpg'; 

const bgImage = new Image();
bgImage.src = 'spain_bg.png'; 

// --- Load Audio ---
const bgMusic = new Audio('bg_music.mp3'); 
bgMusic.loop = true; 
const coinSound = new Audio('coin_sound.wav');
const heartSound = new Audio('coin_sound.wav'); 
const missSound = new Audio('miss_sound.wav'); 
const lossSoundEffect = new Audio('impact_loss.mp3'); 

// Game Object Sizes
const MOCHI_SIZE = 120;
const COIN_SIZE = 60; 
const HEART_SIZE = 50; 

// Game State Variables
let score = 0;
let lives = 3; // Стартовое количество жизней
let gameOver = false;
let gameStarted = false; 
// 💥 НОВОЕ: Переменная для сохранения текущей сложности
let currentDifficulty = 2; 

// Speed and Spawning Parameters 
let baseCoinSpeed = 0; 
let coinSpawnRate = 0; 
let frameCount = 0;
let soundVolume = 75; 

// --- Player (Mochi) ---
const mochi = {
    x: CANVAS_WIDTH / 2 - MOCHI_SIZE / 2, 
    y: CANVAS_HEIGHT - MOCHI_SIZE - 20,   
    width: MOCHI_SIZE,
    height: MOCHI_SIZE,
    speed: 10,
    isMovingLeft: false,
    isMovingRight: false
};

// --- Items (Coins and Hearts) ---
let items = []; 

// =========================================================================
// SOUND FUNCTIONS 
// =========================================================================

function playCoinSound() {
    coinSound.currentTime = 0; 
    coinSound.play();
}

function playHeartSound() {
    heartSound.currentTime = 0;
    heartSound.play();
}

function playMissSound() {
    missSound.currentTime = 0;
    missSound.play();
}

function playLossSoundEffect() {
    lossSoundEffect.currentTime = 0;
    lossSoundEffect.play();
}


// =========================================================================
// MENU LOGIC
// =========================================================================

function showMenu(menuId) {
    // Скрываем все меню и Canvas
    mainMenu.classList.add('hidden');
    difficultyMenu.classList.add('hidden');
    settingsMenu.classList.add('hidden');
    gameOverMenu.classList.add('hidden'); // 💥 Скрываем новое меню
    canvas.classList.add('hidden');

    if (bgMusic) {
        bgMusic.pause();
    }

    // Показываем нужный элемент
    if (menuId === 'main') {
        mainMenu.classList.remove('hidden');
    } else if (menuId === 'difficulty') {
        difficultyMenu.classList.remove('hidden');
    } else if (menuId === 'settings') {
        settingsMenu.classList.remove('hidden');
    } else if (menuId === 'game') {
        canvas.classList.remove('hidden');
        bgMusic.play().catch(e => console.log("Music play blocked by browser."));
    } else if (menuId === 'game-over') { // 💥 НОВАЯ ЛОГИКА
        finalScoreElement.textContent = `Финальный счет: ${score}`;
        gameOverMenu.classList.remove('hidden');
    }
}

function startGame(level) {
    // 💥 СОХРАНЯЕМ ТЕКУЩУЮ СЛОЖНОСТЬ
    currentDifficulty = level; 
    
    // Сброс состояния игры
    score = 0;
    lives = 3;
    gameOver = false;
    items = []; 
    frameCount = 0;
    gameStarted = true; 
    
    // Установка сложности
    switch (level) {
        case 1: baseCoinSpeed = 3; coinSpawnRate = 120; break; 
        case 2: baseCoinSpeed = 4.5; coinSpawnRate = 90; break; 
        case 3: // Mochi Hunter (HARDCORE)
            baseCoinSpeed = 7.5; 
            coinSpawnRate = 50; 
            break;
        default: baseCoinSpeed = 4.5; coinSpawnRate = 90;
    }
    
    showMenu('game');
    // Запуск цикла игры
    requestAnimationFrame(gameLoop);
}

// =========================================================================
// DRAW FUNCTIONS
// =========================================================================

function drawBackground() {
    ctx.drawImage(bgImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawMochi() {
    ctx.drawImage(mochiImage, mochi.x, mochi.y, mochi.width, mochi.height);
}

function drawItems() {
    items.forEach(item => {
        if (item.type === 'coin') {
            ctx.drawImage(coinImage, item.x, item.y, item.width, item.height);
        } else if (item.type === 'heart') {
            ctx.fillStyle = 'red';
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 4;
            // Используем Pixelify Sans
            ctx.font = `${item.width}px 'Pixelify Sans'`; 
            ctx.fillText('❤️', item.x, item.y + item.height * 0.85); 
            ctx.shadowBlur = 0;
        }
    });
}

function drawScore() {
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    ctx.fillStyle = 'white';
    // Используем Pixelify Sans
    ctx.font = '24px "Pixelify Sans"'; 
    ctx.fillText('Score: ' + score, 10, 30); 
    ctx.shadowBlur = 0; 
}

function drawLives() {
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    // Используем Pixelify Sans
    ctx.font = '30px "Pixelify Sans"'; 
    const heartSymbol = '❤️'; 
    
    let heartString = '';
    for (let i = 0; i < lives; i++) {
        heartString += heartSymbol + ' ';
    }
    
    // Сдвиг влево на 200px от правого края (для вмещения 4 сердец)
    const startX = CANVAS_WIDTH - 200; 
    
    ctx.fillText(heartString, startX, 35); 
    ctx.shadowBlur = 0; 
}

function drawGameOver() {
    bgMusic.pause();
    gameStarted = false; 

    // 💥 ИЗМЕНЕНИЕ: Рисуем полупрозрачный фон на Canvas, чтобы было видно, что игра "замерла"
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; 
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // 💥 ИЗМЕНЕНИЕ: Теперь показываем HTML-меню вместо рисования текста на Canvas
    showMenu('game-over');
}


// =========================================================================
// GAME LOGIC
// =========================================================================

function updateMochi() {
    if (mochi.isMovingLeft && mochi.x > 0) {
        mochi.x -= mochi.speed;
    }
    if (mochi.isMovingRight && mochi.x < CANVAS_WIDTH - mochi.width) {
        mochi.x += mochi.speed;
    }
}

function updateItems() {
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        item.y += item.speed;

        // 1. Check: Item missed Mochi
        if (item.y > CANVAS_HEIGHT) {
            if (item.type === 'coin') {
                playLossSoundEffect(); 
                
                lives--; 
                
                if (lives <= 0) {
                    gameOver = true;
                }
            }
            items.splice(i, 1);
            continue; 
        }
        
        // 2. Check for collisions
        if (mochi.x < item.x + item.width &&
            mochi.x + mochi.width > item.x &&
            mochi.y < item.y + item.height &&
            mochi.y + mochi.height > item.y) {
            
            if (item.type === 'coin') {
                score++;
                playCoinSound();
            } else if (item.type === 'heart') {
                // Добавляем жизнь только если их меньше 4 (максимум = 4)
                if (lives < 4) { 
                    lives++;
                }
                playHeartSound();
            }
            
            items.splice(i, 1); 
        }
    }
}

function spawnItem() {
    const isHeart = Math.random() < 1 / 50; 
    
    const itemType = isHeart ? 'heart' : 'coin';
    const itemSize = isHeart ? HEART_SIZE : COIN_SIZE;

    const item = {
        type: itemType,
        x: Math.random() * (CANVAS_WIDTH - itemSize), 
        y: -itemSize, 
        width: itemSize, 
        height: itemSize,
        speed: baseCoinSpeed + Math.random() * 2 
    };
    items.push(item);
}


// =========================================================================
// MAIN GAME LOOP
// =========================================================================

function gameLoop() {
    if (gameOver) {
        drawGameOver();
        return; 
    }

    drawBackground(); 

    updateMochi();
    updateItems(); 
    
    if (frameCount % coinSpawnRate === 0) {
        spawnItem(); 
    }
    frameCount++;

    drawMochi();
    drawItems(); 
    drawScore();
    drawLives();

    requestAnimationFrame(gameLoop);
}

// =========================================================================
// INPUT CONTROLS, EVENT LISTENERS, INITIALIZATION
// =========================================================================

function setupEventListeners() {
    // --- Управление Моти ---
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'A' || e.key === 'a') {
            mochi.isMovingLeft = true;
        } 
        else if (e.key === 'ArrowRight' || e.key === 'D' || e.key === 'd') {
            mochi.isMovingRight = true;
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'A' || e.key === 'a') {
            mochi.isMovingLeft = false;
        } 
        else if (e.key === 'ArrowRight' || e.key === 'D' || e.key === 'd') {
            mochi.isMovingRight = false;
        }
    });

    // --- Кнопки Меню ---
    document.getElementById('btn-play').addEventListener('click', () => {
        showMenu('difficulty');
    });

    document.getElementById('btn-difficulty-menu').addEventListener('click', () => {
        showMenu('difficulty');
    });

    document.getElementById('btn-settings-menu').addEventListener('click', () => {
        showMenu('settings');
    });

    // --- Кнопки Сложности ---
    document.getElementById('difficulty-menu').querySelectorAll('button[data-level]').forEach(button => {
        button.addEventListener('click', (e) => {
            const level = parseInt(e.target.getAttribute('data-level'));
            startGame(level);
        });
    });

    document.getElementById('btn-difficulty-back').addEventListener('click', () => {
        showMenu('main');
    });
    
    // 💥 НОВОЕ: Кнопки "Игра Окончена"
    document.getElementById('btn-restart').addEventListener('click', () => {
        // Запускаем игру с последней выбранной сложностью
        startGame(currentDifficulty); 
    });
    
    document.getElementById('btn-back-to-main').addEventListener('click', () => {
        showMenu('main');
    });


    // --- Кнопки Настроек ---
    document.getElementById('btn-settings-back').addEventListener('click', () => {
        showMenu('main');
    });

    // --- Слайдер Громкости ---
    volumeSlider.addEventListener('input', (e) => {
        soundVolume = e.target.value;
        volumeValueSpan.textContent = soundVolume;
        
        const volumeLevel = soundVolume / 100;
        bgMusic.volume = volumeLevel * 0.5;
        coinSound.volume = volumeLevel;
        heartSound.volume = volumeLevel; 
        missSound.volume = volumeLevel; 
        lossSoundEffect.volume = volumeLevel; 
        
        // Попытка проигрывания музыки при изменении громкости
        if (bgMusic.paused) {
            bgMusic.play().catch(() => {});
        }
    });
}

// 🚩 ИНИЦИАЛИЗАЦИЯ
// Сначала настраиваем все обработчики событий
setupEventListeners(); 
// Затем показываем главное меню
showMenu('main');
