// Socket.IO bağlantısı
const socket = io();

// Oyun durumu
let gameState = {
    roomId: null,
    playerName: null,
    currentRound: 0,
    maxRounds: 10,
    players: [],
    scores: {},
    currentQuestion: null,
    options: [],
    selectedAnswer: null,
    timer: null,
    countdown: null
};

// DOM elementleri
const screens = {
    mainMenu: document.getElementById('main-menu'),
    createRoom: document.getElementById('create-room'),
    joinRoom: document.getElementById('join-room'),
    waitingRoom: document.getElementById('waiting-room'),
    gameScreen: document.getElementById('game-screen'),
    roundResult: document.getElementById('round-result'),
    gameEnd: document.getElementById('game-end')
};

// Ekran değiştirme fonksiyonu
function showScreen(screenId) {
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
    });
    screens[screenId].classList.add('active');
}

// Ana menüye dön
function showMainMenu() {
    showScreen('mainMenu');
    gameState = {
        roomId: null,
        playerName: null,
        currentRound: 0,
        maxRounds: 10,
        players: [],
        scores: {},
        currentQuestion: null,
        options: [],
        selectedAnswer: null,
        timer: null,
        countdown: null
    };
}

// Oda oluşturma ekranını göster
function showCreateRoom() {
    showScreen('createRoom');
}

// Odaya katılma ekranını göster
function showJoinRoom() {
    showScreen('joinRoom');
}

// Oda oluştur
async function createRoom() {
    const playerName = document.getElementById('player-name').value.trim();
    
    if (!playerName) {
        showError('Lütfen bir isim girin.');
        return;
    }
    
    try {
        const response = await fetch('/api/create-room', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.roomId) {
            gameState.roomId = data.roomId;
            gameState.playerName = playerName;
            
            // Odaya katıl
            socket.emit('join-room', {
                roomId: data.roomId,
                playerName: playerName
            });
            
            showWaitingRoom();
        }
    } catch (error) {
        showError('Oda oluşturulurken bir hata oluştu.');
    }
}

// Odaya katıl
function joinRoom() {
    const playerName = document.getElementById('join-player-name').value.trim();
    const roomId = document.getElementById('room-id').value.trim();
    
    if (!playerName) {
        showError('Lütfen bir isim girin.');
        return;
    }
    
    if (!roomId || roomId.length !== 8) {
        showError('Lütfen geçerli bir oda kodu girin.');
        return;
    }
    
    gameState.roomId = roomId;
    gameState.playerName = playerName;
    
    socket.emit('join-room', {
        roomId: roomId,
        playerName: playerName
    });
}

// Bekleme odasını göster
function showWaitingRoom() {
    showScreen('waitingRoom');
    document.getElementById('room-code').textContent = gameState.roomId;
    updatePlayersList();
}

// Oyuncu listesini güncelle
function updatePlayersList() {
    const playersList = document.getElementById('players-list');
    playersList.innerHTML = '';
    
    gameState.players.forEach(player => {
        const playerItem = document.createElement('div');
        playerItem.className = 'player-item';
        playerItem.innerHTML = `
            <i class="fas fa-user"></i>
            <span class="player-name">${player.name}</span>
        `;
        playersList.appendChild(playerItem);
    });
}

// Oda kodunu kopyala
function copyRoomCode() {
    navigator.clipboard.writeText(gameState.roomId).then(() => {
        const btn = document.querySelector('.btn-secondary');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Kopyalandı!';
        btn.style.background = '#48bb78';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
        }, 2000);
    });
}

// Oyun ekranını göster
function showGameScreen() {
    showScreen('gameScreen');
    updateGameInfo();
}

// Oyun bilgilerini güncelle
function updateGameInfo() {
    document.getElementById('current-round').textContent = gameState.currentRound;
    
    // Oyuncu skorlarını güncelle
    if (gameState.players.length >= 1) {
        const player1 = gameState.players[0];
        document.getElementById('player1-score').innerHTML = `
            <span class="player-name">${player1.name}</span>
            <span class="score">${gameState.scores[player1.id] || 0}</span>
        `;
    }
    
    if (gameState.players.length >= 2) {
        const player2 = gameState.players[1];
        document.getElementById('player2-score').innerHTML = `
            <span class="player-name">${player2.name}</span>
            <span class="score">${gameState.scores[player2.id] || 0}</span>
        `;
    }
}

// Yeni tur başlat
function startNewRound(roundData) {
    gameState.currentRound = roundData.round;
    gameState.currentQuestion = roundData.question;
    gameState.options = roundData.options;
    gameState.selectedAnswer = null;
    
    // Bayrağı güncelle
    document.getElementById('current-flag').textContent = roundData.question.flag;
    
    // Seçenekleri oluştur
    const optionsGrid = document.getElementById('options-grid');
    optionsGrid.innerHTML = '';
    
    roundData.options.forEach(option => {
        const optionBtn = document.createElement('button');
        optionBtn.className = 'option-btn';
        optionBtn.innerHTML = `
            <span>${option.flag}</span>
            <span>${option.name}</span>
        `;
        
        optionBtn.onclick = () => selectAnswer(option.name);
        optionsGrid.appendChild(optionBtn);
    });
    
    // Timer başlat
    startTimer();
    
    showGameScreen();
}

// Cevap seç
function selectAnswer(answer) {
    if (gameState.selectedAnswer !== null) return;
    
    gameState.selectedAnswer = answer;
    
    // Seçilen butonu işaretle
    const optionBtns = document.querySelectorAll('.option-btn');
    optionBtns.forEach(btn => {
        const optionName = btn.querySelector('span:last-child').textContent;
        if (optionName === answer) {
            btn.classList.add('selected');
        }
        btn.disabled = true;
    });
    
    // Cevabı gönder
    socket.emit('submit-answer', { answer: answer });
}

// Timer başlat
function startTimer() {
    let timeLeft = 10;
    const timerElement = document.getElementById('timer');
    
    gameState.timer = setInterval(() => {
        timeLeft--;
        timerElement.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(gameState.timer);
            timerElement.textContent = '0';
        }
    }, 1000);
}

// Timer durdur
function stopTimer() {
    if (gameState.timer) {
        clearInterval(gameState.timer);
        gameState.timer = null;
    }
}

// Tur sonucunu göster
function showRoundResult(resultData) {
    stopTimer();
    
    // Doğru cevabı göster
    document.getElementById('correct-flag').textContent = resultData.correctAnswer;
    document.getElementById('correct-country').textContent = resultData.correctAnswer;
    
    // Oyuncu sonuçlarını göster
    const playersResults = document.getElementById('players-results');
    playersResults.innerHTML = '';
    
    resultData.results.forEach(result => {
        const resultItem = document.createElement('div');
        resultItem.className = `player-result ${result.correct ? 'correct' : 'incorrect'}`;
        
        resultItem.innerHTML = `
            <div class="player-result-info">
                <span class="player-name">${result.playerName}</span>
                <span class="answer">Cevap: ${result.answer}</span>
            </div>
            <div class="player-result-score">
                <div class="points">+${result.points} puan</div>
                <div class="total-score">Toplam: ${result.totalScore}</div>
            </div>
        `;
        
        playersResults.appendChild(resultItem);
    });
    
    // Skorları güncelle
    resultData.results.forEach(result => {
        gameState.scores[result.playerId] = result.totalScore;
    });
    
    showScreen('roundResult');
    
    // Geri sayım başlat
    startCountdown();
}

// Geri sayım başlat
function startCountdown() {
    let countdown = 3;
    const countdownElement = document.getElementById('countdown');
    
    gameState.countdown = setInterval(() => {
        countdown--;
        countdownElement.textContent = countdown;
        
        if (countdown <= 0) {
            clearInterval(gameState.countdown);
            gameState.countdown = null;
        }
    }, 1000);
}

// Oyun sonunu göster
function showGameEnd(endData) {
    const finalResults = document.getElementById('final-results');
    finalResults.innerHTML = '';
    
    endData.results.forEach((result, index) => {
        const resultItem = document.createElement('div');
        resultItem.className = `final-result-item ${index === 0 ? 'winner' : ''}`;
        
        const position = index + 1;
        const positionText = position === 1 ? '🥇' : position === 2 ? '🥈' : '🥉';
        
        resultItem.innerHTML = `
            <div class="position">${positionText}</div>
            <div class="player-info">
                <span class="player-name">${result.name}</span>
            </div>
            <div class="final-score">${result.score} puan</div>
        `;
        
        finalResults.appendChild(resultItem);
    });
    
    showScreen('gameEnd');
}

// Tekrar oyna
function playAgain() {
    if (gameState.roomId && gameState.playerName) {
        socket.emit('join-room', {
            roomId: gameState.roomId,
            playerName: gameState.playerName
        });
        showWaitingRoom();
    } else {
        showMainMenu();
    }
}

// Hata göster
function showError(message) {
    document.getElementById('error-message').textContent = message;
    document.getElementById('error-modal').style.display = 'block';
}

// Hata modalını kapat
function closeError() {
    document.getElementById('error-modal').style.display = 'none';
}

// Socket.IO event listeners
socket.on('connect', () => {
    console.log('Sunucuya bağlandı');
});

socket.on('error', (data) => {
    showError(data.message);
});

socket.on('player-joined', (data) => {
    gameState.players = data.players;
    updatePlayersList();
    
    if (data.gameState === 'playing') {
        showGameScreen();
    }
});

socket.on('player-left', (data) => {
    gameState.players = data.players;
    updatePlayersList();
    
    if (data.gameState === 'waiting') {
        showWaitingRoom();
    }
});

socket.on('game-started', (data) => {
    gameState.players = data.players;
    gameState.maxRounds = data.totalRounds;
    showGameScreen();
});

socket.on('new-round', (data) => {
    startNewRound(data);
});

socket.on('round-result', (data) => {
    showRoundResult(data);
});

socket.on('game-finished', (data) => {
    showGameEnd(data);
});

// Enter tuşu ile form gönderme
document.addEventListener('DOMContentLoaded', () => {
    // Oda oluşturma formu
    document.getElementById('player-name').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            createRoom();
        }
    });
    
    // Odaya katılma formu
    document.getElementById('join-player-name').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            joinRoom();
        }
    });
    
    document.getElementById('room-id').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            joinRoom();
        }
    });
    
    // Modal dışına tıklayınca kapat
    document.getElementById('error-modal').addEventListener('click', (e) => {
        if (e.target.id === 'error-modal') {
            closeError();
        }
    });
});

// Sayfa yüklendiğinde ana menüyü göster
window.onload = () => {
    showMainMenu();
}; 