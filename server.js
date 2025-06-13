const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, '.')));

let players = {};
let board = Array(9).fill(null);
let currentTurn = 'X';
let gameActive = true;

function checkWinner() {
  const wins = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6]
  ];
  for (let [a,b,c] of wins) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return board.includes(null) ? null : 'draw';
}

function resetGame() {
  board = Array(9).fill(null);
  currentTurn = 'X';
  gameActive = true;
  io.emit('updateBoard', board);
  io.emit('status', `Player ${currentTurn}'s turn`);
}

io.on('connection', socket => {
  if (!players['X']) {
    players['X'] = socket;
    socket.emit('playerAssignment', 'X');
  } else if (!players['O']) {
    players['O'] = socket;
    socket.emit('playerAssignment', 'O');
    io.emit('status', `Player ${currentTurn}'s turn`);
  } else {
    socket.emit('status', 'Game full');
    return;
  }

  socket.on('makeMove', index => {
    if (!gameActive || board[index] || players[currentTurn] !== socket) return;
    board[index] = currentTurn;
    io.emit('updateBoard', board);
    io.emit('playSound', 'click');

    const winner = checkWinner();
    if (winner) {
      gameActive = false;
      if (winner === 'draw') {
        io.emit('status', `It's a draw!`);
        io.emit('playSound', 'draw');
      } else {
        io.emit('status', `🎉 Player ${winner} wins!`);
        io.emit('playSound', 'win');
      }
      io.emit('gameEnd', { winner: winner === 'draw' ? null : winner, boardState: board });
    } else {
      currentTurn = currentTurn === 'X' ? 'O' : 'X';
      io.emit('status', `Player ${currentTurn}'s turn`);
    }
  });

  socket.on('chatMessage', msg => {
    io.emit('chatMessage', msg);
  });

  socket.on('requestRematch', () => {
    resetGame();
  });

  socket.on('disconnect', () => {
    if (players['X'] === socket) delete players['X'];
    if (players['O'] === socket) delete players['O'];
    board = Array(9).fill(null);
    gameActive = false;
    io.emit('status', 'Player disconnected. Reload to restart.');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
