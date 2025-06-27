const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// Oyun odaları ve oyuncular
const rooms = new Map();
const players = new Map();

// Ülke verileri
const countries = [
  { name: 'Türkiye', flag: '🇹🇷', code: 'TR' },
  { name: 'Almanya', flag: '🇩🇪', code: 'DE' },
  { name: 'Fransa', flag: '🇫🇷', code: 'FR' },
  { name: 'İtalya', flag: '🇮🇹', code: 'IT' },
  { name: 'İspanya', flag: '🇪🇸', code: 'ES' },
  { name: 'İngiltere', flag: '🇬🇧', code: 'GB' },
  { name: 'Hollanda', flag: '🇳🇱', code: 'NL' },
  { name: 'Belçika', flag: '🇧🇪', code: 'BE' },
  { name: 'Portekiz', flag: '🇵🇹', code: 'PT' },
  { name: 'Yunanistan', flag: '🇬🇷', code: 'GR' },
  { name: 'Polonya', flag: '🇵🇱', code: 'PL' },
  { name: 'Çek Cumhuriyeti', flag: '🇨🇿', code: 'CZ' },
  { name: 'Macaristan', flag: '🇭🇺', code: 'HU' },
  { name: 'Romanya', flag: '🇷🇴', code: 'RO' },
  { name: 'Bulgaristan', flag: '🇧🇬', code: 'BG' },
  { name: 'Hırvatistan', flag: '🇭🇷', code: 'HR' },
  { name: 'Slovakya', flag: '🇸🇰', code: 'SK' },
  { name: 'Slovenya', flag: '🇸🇮', code: 'SI' },
  { name: 'Litvanya', flag: '🇱🇹', code: 'LT' },
  { name: 'Letonya', flag: '🇱🇻', code: 'LV' },
  { name: 'Estonya', flag: '🇪🇪', code: 'EE' },
  { name: 'Finlandiya', flag: '🇫🇮', code: 'FI' },
  { name: 'İsveç', flag: '🇸🇪', code: 'SE' },
  { name: 'Norveç', flag: '🇳🇴', code: 'NO' },
  { name: 'Danimarka', flag: '🇩🇰', code: 'DK' },
  { name: 'İrlanda', flag: '🇮🇪', code: 'IE' },
  { name: 'Avusturya', flag: '🇦🇹', code: 'AT' },
  { name: 'İsviçre', flag: '🇨🇭', code: 'CH' },
  { name: 'Lüksemburg', flag: '🇱🇺', code: 'LU' },
  { name: 'Malta', flag: '🇲🇹', code: 'MT' },
  { name: 'Kıbrıs', flag: '🇨🇾', code: 'CY' },
  { name: 'ABD', flag: '🇺🇸', code: 'US' },
  { name: 'Kanada', flag: '🇨🇦', code: 'CA' },
  { name: 'Meksika', flag: '🇲🇽', code: 'MX' },
  { name: 'Brezilya', flag: '🇧🇷', code: 'BR' },
  { name: 'Arjantin', flag: '🇦🇷', code: 'AR' },
  { name: 'Şili', flag: '🇨🇱', code: 'CL' },
  { name: 'Peru', flag: '🇵🇪', code: 'PE' },
  { name: 'Kolombiya', flag: '🇨🇴', code: 'CO' },
  { name: 'Venezuela', flag: '🇻🇪', code: 'VE' },
  { name: 'Uruguay', flag: '🇺🇾', code: 'UY' },
  { name: 'Paraguay', flag: '🇵🇾', code: 'PY' },
  { name: 'Bolivya', flag: '🇧🇴', code: 'BO' },
  { name: 'Ekvador', flag: '🇪🇨', code: 'EC' },
  { name: 'Guyana', flag: '🇬🇾', code: 'GY' },
  { name: 'Surinam', flag: '🇸🇷', code: 'SR' },
  { name: 'Fransız Guyanası', flag: '🇬🇫', code: 'GF' },
  { name: 'Japonya', flag: '🇯🇵', code: 'JP' },
  { name: 'Çin', flag: '🇨🇳', code: 'CN' },
  { name: 'Güney Kore', flag: '🇰🇷', code: 'KR' },
  { name: 'Kuzey Kore', flag: '🇰🇵', code: 'KP' },
  { name: 'Vietnam', flag: '🇻🇳', code: 'VN' },
  { name: 'Tayland', flag: '🇹🇭', code: 'TH' },
  { name: 'Malezya', flag: '🇲🇾', code: 'MY' },
  { name: 'Singapur', flag: '🇸🇬', code: 'SG' },
  { name: 'Endonezya', flag: '🇮🇩', code: 'ID' },
  { name: 'Filipinler', flag: '🇵🇭', code: 'PH' },
  { name: 'Myanmar', flag: '🇲🇲', code: 'MM' },
  { name: 'Laos', flag: '🇱🇦', code: 'LA' },
  { name: 'Kamboçya', flag: '🇰🇭', code: 'KH' },
  { name: 'Brunei', flag: '🇧🇳', code: 'BN' },
  { name: 'Doğu Timor', flag: '🇹🇱', code: 'TL' },
  { name: 'Hindistan', flag: '🇮🇳', code: 'IN' },
  { name: 'Pakistan', flag: '🇵🇰', code: 'PK' },
  { name: 'Bangladeş', flag: '🇧🇩', code: 'BD' },
  { name: 'Sri Lanka', flag: '🇱🇰', code: 'LK' },
  { name: 'Nepal', flag: '🇳🇵', code: 'NP' },
  { name: 'Bhutan', flag: '🇧🇹', code: 'BT' },
  { name: 'Maldivler', flag: '🇲🇻', code: 'MV' },
  { name: 'Afganistan', flag: '🇦🇫', code: 'AF' },
  { name: 'İran', flag: '🇮🇷', code: 'IR' },
  { name: 'Irak', flag: '🇮🇶', code: 'IQ' },
  { name: 'Suriye', flag: '🇸🇾', code: 'SY' },
  { name: 'Lübnan', flag: '🇱🇧', code: 'LB' },
  { name: 'İsrail', flag: '🇮🇱', code: 'IL' },
  { name: 'Filistin', flag: '🇵🇸', code: 'PS' },
  { name: 'Ürdün', flag: '🇯🇴', code: 'JO' },
  { name: 'Suudi Arabistan', flag: '🇸🇦', code: 'SA' },
  { name: 'Katar', flag: '🇶🇦', code: 'QA' },
  { name: 'Kuveyt', flag: '🇰🇼', code: 'KW' },
  { name: 'Bahreyn', flag: '🇧🇭', code: 'BH' },
  { name: 'Umman', flag: '🇴🇲', code: 'OM' },
  { name: 'Yemen', flag: '🇾🇪', code: 'YE' },
  { name: 'Birleşik Arap Emirlikleri', flag: '🇦🇪', code: 'AE' },
  { name: 'Mısır', flag: '🇪🇬', code: 'EG' },
  { name: 'Sudan', flag: '🇸🇩', code: 'SD' },
  { name: 'Libya', flag: '🇱🇾', code: 'LY' },
  { name: 'Tunus', flag: '🇹🇳', code: 'TN' },
  { name: 'Cezayir', flag: '🇩🇿', code: 'DZ' },
  { name: 'Fas', flag: '🇲🇦', code: 'MA' },
  { name: 'Mauritania', flag: '🇲🇷', code: 'MR' },
  { name: 'Senegal', flag: '🇸🇳', code: 'SN' },
  { name: 'Gambiya', flag: '🇬🇲', code: 'GM' },
  { name: 'Gine-Bissau', flag: '🇬🇼', code: 'GW' },
  { name: 'Gine', flag: '🇬🇳', code: 'GN' },
  { name: 'Sierra Leone', flag: '🇸🇱', code: 'SL' },
  { name: 'Liberya', flag: '🇱🇷', code: 'LR' },
  { name: 'Fildişi Sahili', flag: '🇨🇮', code: 'CI' },
  { name: 'Gana', flag: '🇬🇭', code: 'GH' },
  { name: 'Togo', flag: '🇹🇬', code: 'TG' },
  { name: 'Benin', flag: '🇧🇯', code: 'BJ' },
  { name: 'Nijerya', flag: '🇳🇬', code: 'NG' },
  { name: 'Nijer', flag: '🇳🇪', code: 'NE' },
  { name: 'Burkina Faso', flag: '🇧🇫', code: 'BF' },
  { name: 'Mali', flag: '🇲🇱', code: 'ML' },
  { name: 'Çad', flag: '🇹🇩', code: 'TD' },
  { name: 'Kamerun', flag: '🇨🇲', code: 'CM' },
  { name: 'Orta Afrika Cumhuriyeti', flag: '🇨🇫', code: 'CF' },
  { name: 'Gabon', flag: '🇬🇦', code: 'GA' },
  { name: 'Kongo', flag: '🇨🇬', code: 'CG' },
  { name: 'Kongo Demokratik Cumhuriyeti', flag: '🇨🇩', code: 'CD' },
  { name: 'Angola', flag: '🇦🇴', code: 'AO' },
  { name: 'Zambiya', flag: '🇿🇲', code: 'ZM' },
  { name: 'Zimbabve', flag: '🇿🇼', code: 'ZW' },
  { name: 'Botsvana', flag: '🇧🇼', code: 'BW' },
  { name: 'Namibya', flag: '🇳🇦', code: 'NA' },
  { name: 'Güney Afrika', flag: '🇿🇦', code: 'ZA' },
  { name: 'Lesotho', flag: '🇱🇸', code: 'LS' },
  { name: 'Esvatini', flag: '🇸🇿', code: 'SZ' },
  { name: 'Mozambik', flag: '🇲🇿', code: 'MZ' },
  { name: 'Malavi', flag: '🇲🇼', code: 'MW' },
  { name: 'Tanzanya', flag: '🇹🇿', code: 'TZ' },
  { name: 'Kenya', flag: '🇰🇪', code: 'KE' },
  { name: 'Uganda', flag: '🇺🇬', code: 'UG' },
  { name: 'Ruanda', flag: '🇷🇼', code: 'RW' },
  { name: 'Burundi', flag: '🇧🇮', code: 'BI' },
  { name: 'Etiyopya', flag: '🇪🇹', code: 'ET' },
  { name: 'Eritre', flag: '🇪🇷', code: 'ER' },
  { name: 'Cibuti', flag: '🇩🇯', code: 'DJ' },
  { name: 'Somali', flag: '🇸🇴', code: 'SO' },
  { name: 'Madagaskar', flag: '🇲🇬', code: 'MG' },
  { name: 'Mauritius', flag: '🇲🇺', code: 'MU' },
  { name: 'Seyşeller', flag: '🇸🇨', code: 'SC' },
  { name: 'Komorlar', flag: '🇰🇲', code: 'KM' },
  { name: 'Avustralya', flag: '🇦🇺', code: 'AU' },
  { name: 'Yeni Zelanda', flag: '🇳🇿', code: 'NZ' },
  { name: 'Papua Yeni Gine', flag: '🇵🇬', code: 'PG' },
  { name: 'Fiji', flag: '🇫🇯', code: 'FJ' },
  { name: 'Vanuatu', flag: '🇻🇺', code: 'VU' },
  { name: 'Solomon Adaları', flag: '🇸🇧', code: 'SB' },
  { name: 'Kiribati', flag: '🇰🇮', code: 'KI' },
  { name: 'Tuvalu', flag: '🇹🇻', code: 'TV' },
  { name: 'Nauru', flag: '🇳🇷', code: 'NR' },
  { name: 'Palau', flag: '🇵🇼', code: 'PW' },
  { name: 'Mikronezya', flag: '🇫🇲', code: 'FM' },
  { name: 'Marshall Adaları', flag: '🇲🇭', code: 'MH' },
  { name: 'Rusya', flag: '🇷🇺', code: 'RU' },
  { name: 'Ukrayna', flag: '🇺🇦', code: 'UA' },
  { name: 'Belarus', flag: '🇧🇾', code: 'BY' },
  { name: 'Moldova', flag: '🇲🇩', code: 'MD' },
  { name: 'Gürcistan', flag: '🇬🇪', code: 'GE' },
  { name: 'Ermenistan', flag: '🇦🇲', code: 'AM' },
  { name: 'Azerbaycan', flag: '🇦🇿', code: 'AZ' },
  { name: 'Kazakistan', flag: '🇰🇿', code: 'KZ' },
  { name: 'Özbekistan', flag: '🇺🇿', code: 'UZ' },
  { name: 'Türkmenistan', flag: '🇹🇲', code: 'TM' },
  { name: 'Kırgızistan', flag: '🇰🇬', code: 'KG' },
  { name: 'Tacikistan', flag: '🇹🇯', code: 'TJ' },
  { name: 'Moğolistan', flag: '🇲🇳', code: 'MN' },
  { name: 'Kuzey Makedonya', flag: '🇲🇰', code: 'MK' },
  { name: 'Bosna Hersek', flag: '🇧🇦', code: 'BA' },
  { name: 'Sırbistan', flag: '🇷🇸', code: 'RS' },
  { name: 'Karadağ', flag: '🇲🇪', code: 'ME' },
  { name: 'Kosova', flag: '🇽🇰', code: 'XK' },
  { name: 'Arnavutluk', flag: '🇦🇱', code: 'AL' }
];

// Rastgele ülke seçme fonksiyonu
function getRandomCountries(count) {
  const shuffled = [...countries].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Oda oluşturma
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
    startTime: null
  };
  rooms.set(roomId, room);
  return roomId;
}

// Ana sayfa
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Oda oluşturma endpoint'i
app.post('/api/create-room', (req, res) => {
  const roomId = createRoom();
  res.json({ roomId });
});

// Oda bilgisi endpoint'i
app.get('/api/room/:roomId', (req, res) => {
  const room = rooms.get(req.params.roomId);
  if (room) {
    res.json(room);
  } else {
    res.status(404).json({ error: 'Oda bulunamadı' });
  }
});

// Socket.IO bağlantı yönetimi
io.on('connection', (socket) => {
  console.log('Yeni bağlantı:', socket.id);

  // Oyuncu odaya katılma
  socket.on('join-room', (data) => {
    const { roomId, playerName } = data;
    const room = rooms.get(roomId);
    
    if (!room) {
      socket.emit('error', { message: 'Oda bulunamadı' });
      return;
    }

    if (room.players.length >= 2) {
      socket.emit('error', { message: 'Oda dolu' });
      return;
    }

    // Oyuncuyu odaya ekle
    const player = {
      id: socket.id,
      name: playerName,
      score: 0,
      currentAnswer: null,
      answerTime: null
    };

    room.players.push(player);
    room.scores[socket.id] = 0;
    
    players.set(socket.id, { roomId, playerName });
    socket.join(roomId);

    // Odaya bilgi gönder
    io.to(roomId).emit('player-joined', {
      players: room.players,
      gameState: room.gameState
    });

    // İki oyuncu da varsa oyunu başlat
    if (room.players.length === 2) {
      startGame(roomId);
    }
  });

  // Cevap gönderme
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

    // Her iki oyuncu da cevap verdi mi kontrol et
    const allAnswered = room.players.every(p => p.currentAnswer !== null);
    
    if (allAnswered) {
      setTimeout(() => {
        evaluateRound(playerInfo.roomId);
      }, 1000);
    }
  });

  // Bağlantı kesildiğinde
  socket.on('disconnect', () => {
    const playerInfo = players.get(socket.id);
    if (playerInfo) {
      const room = rooms.get(playerInfo.roomId);
      if (room) {
        room.players = room.players.filter(p => p.id !== socket.id);
        delete room.scores[socket.id];
        
        if (room.players.length === 0) {
          rooms.delete(playerInfo.roomId);
        } else {
          io.to(playerInfo.roomId).emit('player-left', {
            players: room.players,
            gameState: 'waiting'
          });
        }
      }
      players.delete(socket.id);
    }
  });
});

// Oyunu başlatma
function startGame(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.gameState = 'playing';
  room.currentRound = 0;
  room.questions = getRandomCountries(10);
  room.startTime = Date.now();

  // Her oyuncunun skorunu sıfırla
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

// Sonraki tur
function nextRound(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.currentRound++;
  
  if (room.currentRound > room.maxRounds) {
    endGame(roomId);
    return;
  }

  // Oyuncuların cevaplarını sıfırla
  room.players.forEach(player => {
    player.currentAnswer = null;
    player.answerTime = null;
  });

  const currentQuestion = room.questions[room.currentRound - 1];
  const options = getRandomCountries(4);
  
  // Doğru cevabı seçenekler arasına ekle
  if (!options.find(opt => opt.name === currentQuestion.name)) {
    options[0] = currentQuestion;
  }

  // Seçenekleri karıştır
  const shuffledOptions = options.sort(() => 0.5 - Math.random());

  io.to(roomId).emit('new-round', {
    round: room.currentRound,
    question: currentQuestion,
    options: shuffledOptions,
    players: room.players
  });
}

// Tur değerlendirme
function evaluateRound(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  const currentQuestion = room.questions[room.currentRound - 1];
  const results = [];

  room.players.forEach(player => {
    const isCorrect = player.currentAnswer === currentQuestion.name;
    const timeBonus = player.answerTime ? Math.max(0, 10 - Math.floor((player.answerTime - room.startTime) / 1000)) : 0;
    const points = isCorrect ? 10 + timeBonus : 0;
    
    room.scores[player.id] += points;
    player.score = room.scores[player.id];
    
    results.push({
      playerId: player.id,
      playerName: player.name,
      answer: player.currentAnswer,
      correct: isCorrect,
      points: points,
      totalScore: player.score,
      timeBonus: timeBonus
    });
  });

  io.to(roomId).emit('round-result', {
    correctAnswer: currentQuestion.name,
    results: results,
    players: room.players
  });

  // 3 saniye sonra sonraki tur
  setTimeout(() => {
    nextRound(roomId);
  }, 3000);
}

// Oyunu bitirme
function endGame(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.gameState = 'finished';
  
  const finalResults = room.players.map(player => ({
    id: player.id,
    name: player.name,
    score: room.scores[player.id]
  })).sort((a, b) => b.score - a.score);

  io.to(roomId).emit('game-finished', {
    results: finalResults,
    winner: finalResults[0]
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
}); 