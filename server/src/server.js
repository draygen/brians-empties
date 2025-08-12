const express = require('express');
const cors    = require('cors');
const path    = require('path');
const http    = require('http');
const { GameState } = require('./gameState');

const app    = express();
const server = http.createServer(app);
const io     = require('socket.io')(server);

const port = process.env.PORT || 3000;

app.use(cors());

// Serve the built client
const clientDist = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));

// Game state and player velocities
const game = new GameState();
const velocities = {};     // { socketId: { vx, vy } }
const SPEED      = 150;    // pixels per second
const TICK       = 1000/30; // 30 FPS

io.on('connection', (socket) => {
  // Add new player
  game.addPlayer(socket.id, socket.id);
  velocities[socket.id] = { vx: 0, vy: 0 };

  // Receive movement input (normalized dx,dy)
  socket.on('input', ({ dx, dy }) => {
    velocities[socket.id].vx = dx * SPEED;
    velocities[socket.id].vy = dy * SPEED;
  });

  // Player collects a can (empty)
  socket.on('collectCan', (canId) => {
    game.collectCan(socket.id, canId);
  });

  // Player delivers their collected can
  socket.on('deliver', () => {
    game.deliverCans(socket.id);
  });

  socket.on('disconnect', () => {
    game.removePlayer(socket.id);
    delete velocities[socket.id];
  });
});

// Game loop: move players, then broadcast state
let last = Date.now();
setInterval(() => {
  const now = Date.now();
  const dt  = (now - last) / 1000;
  last = now;

  const state = game.getState(); // { players, cans, walls, doorPosition }
  // update players' positions based on velocities
  for (const id in state.players) {
    const p   = state.players[id];
    const vel = velocities[id];
    if (vel) {
      p.x += vel.vx * dt;
      p.y += vel.vy * dt;
      // clamp to 800x600 canvas bounds (adjust margins as needed)
      p.x = Math.max(10, Math.min(790, p.x));
      p.y = Math.max(10, Math.min(590, p.y));
    }
  }

  // Broadcast full state to all clients
  io.emit('state', state);
}, TICK);

server.listen(port, '0.0.0.0', () => {
  console.log(`Server is listening on port ${port}`);
});

