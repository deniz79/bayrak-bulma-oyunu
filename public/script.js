// Socket.IO bağlantısı
const socket = io();

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

const screens = {
  mainMenu: document.getElementById('main-menu'),
  createRoom: document.getElementById('create-room'),
  joinRoom: document.getElementById('join-room'),
  waitingRoom: document.getElementById('waiting-room'),
  gameScreen: document.getElementById('game-screen'),
  roundResult: document.getElementById('round-result'),
  gameEnd: document.getElementById('game-end'),
  errorModal: document.getElementById('error-modal')
};

function showScreen(screenId) {
  Object.values(screens).forEach(screen => {
    screen.classList.remove('active');
  });
  screens[screenId].classList.add('active');
}

function showMainMenu() {
  showScreen('mainMenu');
}
function showCreateRoom() {
  showScreen('createRoom');
}
function showJoinRoom() {
  showScreen('joinRoom');
}

function startSinglePlayer() {
  const playerName = prompt('Oyuncu adınızı girin:');
  if (!playerName) return;
  gameState.playerName = playerName;
  socket.emit('start-single-player', { playerName });
}

function createRoom() {
  const playerName = document.getElementById('create-player-name').value.trim();
  if (!playerName) return showError('Oyuncu adı giriniz.');
  gameState.playerName = playerName;
  socket.emit('start-single-player', { playerName });
}

function joinRoom() {
  const playerName = document.getElementById('join-player-name').value.trim();
  const roomId = document.getElementById('join-room-id').value.trim();
  if (!playerName || !roomId) return showError('Tüm alanları doldurun.');
  gameState.playerName = playerName;
  gameState.roomId = roomId;
  socket.emit('join-room', { roomId, playerName });
}

function playAgain() {
  showMainMenu();
}

function showError(msg) {
  document.getElementById('error-message').innerText = msg;
  screens.errorModal.classList.add('active');
}
function closeError() {
  screens.errorModal.classList.remove('active');
}

// Oyun ekranı ve round yönetimi
document.addEventListener('DOMContentLoaded', () => {
  showMainMenu();
});

socket.on('player-joined', (data) => {
  if (data.gameState === 'waiting') {
    showScreen('waitingRoom');
    document.getElementById('waiting-room-id').innerText = gameState.roomId;
    const list = document.getElementById('waiting-players');
    list.innerHTML = '';
    data.players.forEach(p => {
      const li = document.createElement('li');
      li.innerText = p.name;
      list.appendChild(li);
    });
  }
});

socket.on('game-started', (data) => {
  gameState.currentRound = 0;
  gameState.maxRounds = data.totalRounds;
  gameState.players = data.players;
  showScreen('gameScreen');
});

socket.on('new-round', (data) => {
  gameState.currentRound = data.round;
  gameState.currentQuestion = data.question;
  gameState.options = data.options;
  gameState.players = data.players;
  document.getElementById('current-round').innerText = data.round;
  document.getElementById('current-flag').innerText = data.question.flag;
  const grid = document.getElementById('options-grid');
  grid.innerHTML = '';
  data.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.innerText = opt.name;
    btn.onclick = () => submitAnswer(opt.name);
    grid.appendChild(btn);
  });
  // Skorları göster
  const scoresDiv = document.getElementById('players-scores');
  scoresDiv.innerHTML = '';
  data.players.forEach(p => {
    const div = document.createElement('div');
    div.className = 'player-score';
    div.innerHTML = `<span class="player-name">${p.name}</span> <span class="score">${p.score || 0}</span>`;
    scoresDiv.appendChild(div);
  });
  startTimer();
});

function startTimer() {
  let time = 10;
  document.getElementById('timer').innerText = time;
  clearInterval(gameState.timer);
  gameState.timer = setInterval(() => {
    time--;
    document.getElementById('timer').innerText = time;
    if (time <= 0) {
      clearInterval(gameState.timer);
    }
  }, 1000);
}

function submitAnswer(answer) {
  clearInterval(gameState.timer);
  socket.emit('submit-answer', { answer });
}

socket.on('round-finished', (data) => {
  showScreen('roundResult');
  document.getElementById('correct-flag').innerText = gameState.currentQuestion.flag;
  document.getElementById('correct-country').innerText = gameState.currentQuestion.name;
  const resultsDiv = document.getElementById('players-results');
  resultsDiv.innerHTML = '';
  data.results.forEach(r => {
    const div = document.createElement('div');
    div.className = r.correct ? 'correct' : 'wrong';
    div.innerHTML = `<b>${r.playerName}:</b> ${r.answer || '-'} (${r.points} puan)`;
    resultsDiv.appendChild(div);
  });
  let countdown = 3;
  document.getElementById('countdown').innerText = countdown;
  clearInterval(gameState.countdown);
  gameState.countdown = setInterval(() => {
    countdown--;
    document.getElementById('countdown').innerText = countdown;
    if (countdown <= 0) {
      clearInterval(gameState.countdown);
    }
  }, 1000);
});

socket.on('game-finished', (data) => {
  showScreen('gameEnd');
  const resultsDiv = document.getElementById('final-results');
  resultsDiv.innerHTML = '';
  data.results.forEach(r => {
    const div = document.createElement('div');
    div.innerHTML = `<b>${r.name}:</b> ${r.score} puan`;
    resultsDiv.appendChild(div);
  });
});

socket.on('error', (data) => {
  showError(data.message);
}); 