const socket = io();
let playerSymbol = '';
const board = document.getElementById('board');
const cells = document.querySelectorAll('.cell');
const status = document.getElementById('status');
const rematchBtn = document.getElementById('rematchBtn');
const chatInput = document.getElementById('chatInput');
const messages = document.getElementById('messages');

const sounds = {
  click: document.getElementById('clickSound'),
  win: document.getElementById('winSound'),
  draw: document.getElementById('drawSound'),
  chat: document.getElementById('chatSound')
};

cells.forEach(cell => {
  cell.addEventListener('click', () => {
    const index = cell.dataset.index;
    socket.emit('makeMove', index);
  });
});

rematchBtn.addEventListener('click', () => {
  socket.emit('requestRematch');
});

chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && chatInput.value.trim() !== '') {
    socket.emit('chatMessage', chatInput.value.trim());
    chatInput.value = '';
  }
});

socket.on('playerAssignment', symbol => {
  playerSymbol = symbol;
  document.getElementById(`player${symbol}`).textContent = `You are Player ${symbol}`;
});

socket.on('updateBoard', boardState => {
  cells.forEach((cell, idx) => {
    cell.textContent = boardState[idx] || '';
  });
});

socket.on('status', msg => {
  status.textContent = msg;
});

socket.on('playSound', type => {
  if (sounds[type]) sounds[type].play();
});

socket.on('gameEnd', ({ winner, boardState }) => {
  if (winner) {
    status.textContent = `🎉 ${winner} wins!`;
  } else {
    status.textContent = "It's a draw!";
  }
  rematchBtn.style.display = 'block';
});

socket.on('chatMessage', msg => {
  const div = document.createElement('div');
  div.textContent = msg;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
  sounds.chat.play();
});
