const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { GameState } = require('./gameState');

const app = express();
app.use(cors());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../../../client/dist')));

// The catchall handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../../client/dist/index.html'));
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const gameState = new GameState();

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('join_game', ({ playerName }) => {
    gameState.addPlayer(socket.id, playerName);
    io.emit('game_state', gameState.getState());
  });

  socket.on('player_move', ({ x, y }) => {
    gameState.updatePlayerPosition(socket.id, x, y);
    io.emit('game_state', gameState.getState());
  });

  socket.on('collect_can', (canId) => {
    gameState.collectCan(socket.id, canId);
    io.emit('game_state', gameState.getState());
  });

  socket.on('deliver_cans', () => {
    gameState.deliverCans(socket.id);
    io.emit('game_state', gameState.getState());
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    gameState.removePlayer(socket.id);
    io.emit('game_state', gameState.getState());
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});