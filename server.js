const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new socketIo.Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

const countries = [
  { name: 'Türkiye', flag: '🇹🇷' }, { name: 'Almanya', flag: '🇩🇪' }, { name: 'Fransa', flag: '🇫🇷' }, { name: 'İtalya', flag: '🇮🇹' },
  { name: 'İspanya', flag: '🇪🇸' }, { name: 'İngiltere', flag: '🇬🇧' }, { name: 'Hollanda', flag: '🇳🇱' }, { name: 'Belçika', flag: '🇧🇪' },
  { name: 'Portekiz', flag: '🇵🇹' }, { name: 'Yunanistan', flag: '🇬🇷' }, { name: 'Polonya', flag: '🇵🇱' }, { name: 'Çek Cumhuriyeti', flag: '🇨🇿' },
  { name: 'Macaristan', flag: '🇭🇺' }, { name: 'Romanya', flag: '🇷🇴' }, { name: 'Bulgaristan', flag: '🇧🇬' }, { name: 'Hırvatistan', flag: '🇭🇷' },
  { name: 'Slovakya', flag: '🇸🇰' }, { name: 'Slovenya', flag: '🇸🇮' }, { name: 'Litvanya', flag: '🇱🇹' }, { name: 'Letonya', flag: '🇱🇻' },
  { name: 'Estonya', flag: '🇪🇪' }, { name: 'Finlandiya', flag: '🇫🇮' }, { name: 'İsveç', flag: '🇸🇪' }, { name: 'Norveç', flag: '🇳🇴' },
  { name: 'Danimarka', flag: '🇩🇰' }, { name: 'İrlanda', flag: '🇮🇪' }, { name: 'Avusturya', flag: '🇦🇹' }, { name: 'İsviçre', flag: '🇨🇭' },
  { name: 'Lüksemburg', flag: '🇱🇺' }, { name: 'Malta', flag: '🇲🇹' }, { name: 'Kıbrıs', flag: '🇨🇾' }, { name: 'ABD', flag: '🇺🇸' },
  { name: 'Kanada', flag: '🇨🇦' }, { name: 'Meksika', flag: '🇲🇽' }, { name: 'Brezilya', flag: '🇧🇷' }, { name: 'Arjantin', flag: '🇦🇷' },
  { name: 'Japonya', flag: '🇯🇵' }, { name: 'Rusya', flag: '🇷🇺' }
];

function getRandomCountries(count) {
  const shuffled = [...countries].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

const rooms = new Map();
const players = new Map();

function createRoom() {
  const roomId = uuidv4().substring(0, 8);
  const room = {
    id: roomId,
    players: [],
    gameState: 'waiting',
    currentRound: 0,
    maxRounds: 10,
    questions: [],
    scores: {},
    startTime: null,
    isSinglePlayer: false
  };
  rooms.set(roomId, room);
  return roomId;
}

function startGame(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  room.gameState = 'playing';
  room.currentRound = 0;
  room.questions = getRandomCountries(10);
  room.startTime = Date.now();
  room.players.forEach(player => {
    room.scores[player.id] = 0;
    player.score = 0;
  });
  io.to(roomId).emit('game-started', {
    players: room.players,
    totalRounds: room.maxRounds
  });
  nextRound(roomId);
}

function nextRound(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  room.currentRound++;
  if (room.currentRound > room.maxRounds) {
    endGame(roomId);
    return;
  }
  room.players.forEach(player => {
    player.currentAnswer = null;
    player.answerTime = null;
  });
  const currentQuestion = room.questions[room.currentRound - 1];
  const options = getRandomCountries(4);
  if (!options.find(opt => opt.name === currentQuestion.name)) {
    options[0] = currentQuestion;
  }
  const shuffledOptions = options.sort(() => 0.5 - Math.random());
  io.to(roomId).emit('new-round', {
    round: room.currentRound,
    question: currentQuestion,
    options: shuffledOptions,
    players: room.players
  });
  if (room.isSinglePlayer) {
    const botPlayer = room.players.find(p => p.isBot);
    if (botPlayer) {
      const randomDelay = Math.random() * 3000 + 2000;
      setTimeout(() => {
        const randomAnswer = shuffledOptions[Math.floor(Math.random() * shuffledOptions.length)];
        botPlayer.currentAnswer = randomAnswer.name;
        botPlayer.answerTime = Date.now();
      }, randomDelay);
    }
  }
}

function evaluateRound(roomId) {
  const room = rooms.get(roomId);
  if (!room || !room.questions[room.currentRound - 1]) return;
  const correctAnswer = room.questions[room.currentRound - 1].name;
  const roundResults = [];
  room.players.forEach(player => {
    let points = 0;
    if (player.currentAnswer === correctAnswer) {
      points = 10;
      const answerSeconds = (player.answerTime - room.startTime - (room.currentRound - 1) * 10000) / 1000;
      points += Math.max(0, 10 - Math.floor(answerSeconds));
    }
    room.scores[player.id] = (room.scores[player.id] || 0) + points;
    player.score = room.scores[player.id];
    roundResults.push({
      playerId: player.id,
      playerName: player.name,
      answer: player.currentAnswer,
      correct: player.currentAnswer === correctAnswer,
      points: points,
      totalScore: player.score
    });
  });
  io.to(roomId).emit('round-finished', {
    results: roundResults,
    correctAnswer: correctAnswer
  });
  setTimeout(() => nextRound(roomId), 4000);
}

function endGame(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  room.gameState = 'finished';
  const finalResults = room.players.map(player => ({
    id: player.id,
    name: player.name,
    score: room.scores[player.id] || 0
  })).sort((a, b) => b.score - a.score);
  io.to(roomId).emit('game-finished', {
    results: finalResults,
    winner: finalResults[0]
  });
}

io.on('connection', (socket) => {
  console.log('Yeni bağlantı:', socket.id);
  socket.on('join-room', (data) => {
    const { roomId, playerName } = data;
    const room = rooms.get(roomId);
    if (!room) return socket.emit('error', { message: 'Oda bulunamadı' });
    if (room.players.length >= 2) return socket.emit('error', { message: 'Oda dolu' });
    const player = { id: socket.id, name: playerName, score: 0, isBot: false };
    room.players.push(player);
    room.scores[socket.id] = 0;
    players.set(socket.id, { roomId, playerName });
    socket.join(roomId);
    io.to(roomId).emit('player-joined', { players: room.players, gameState: room.gameState });
    if (room.players.length === 2) {
      startGame(roomId);
    }
  });
  socket.on('start-single-player', (data) => {
    const { playerName } = data;
    const roomId = createRoom();
    const room = rooms.get(roomId);
    room.isSinglePlayer = true;
    const humanPlayer = { id: socket.id, name: playerName, score: 0, currentAnswer: null, answerTime: null, isBot: false };
    room.players.push(humanPlayer);
    room.scores[socket.id] = 0;
    players.set(socket.id, { roomId, playerName });
    socket.join(roomId);
    const botPlayer = { id: `bot-${roomId}`, name: 'Bot', score: 0, currentAnswer: null, answerTime: null, isBot: true };
    room.players.push(botPlayer);
    room.scores[botPlayer.id] = 0;
    startGame(roomId);
  });
  socket.on('submit-answer', (data) => {
    const { answer } = data;
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    const room = rooms.get(playerInfo.roomId);
    if (!room || room.gameState !== 'playing') return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player || player.currentAnswer !== null) return;
    player.currentAnswer = answer;
    player.answerTime = Date.now();
    const allAnswered = room.players.every(p => p.currentAnswer !== null);
    if (allAnswered) {
      setTimeout(() => evaluateRound(playerInfo.roomId), 1000);
    }
  });
  socket.on('disconnect', () => {
    console.log('Bağlantı kesildi:', socket.id);
    const playerInfo = players.get(socket.id);
    if (playerInfo) {
      const room = rooms.get(playerInfo.roomId);
      if (room) {
        room.players = room.players.filter(p => p.id !== socket.id);
        if (room.gameState === 'playing' && room.players.length < 2) {
           io.to(playerInfo.roomId).emit('player-disconnected', { message: `${playerInfo.playerName} oyundan ayrıldı.` });
           endGame(playerInfo.roomId);
        }
      }
      players.delete(socket.id);
    }
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
}); 