const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);

const port = process.env.PORT || 3000;

app.use(cors());

// Serve built client
const clientDist = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));

// --- Simple game state ---
const players = {};            // { socketId: { x, y, color } }
const SPEED = 150;             // px per second
const TICK = 1000 / 30;        // 30fps

io.on('connection', (socket) => {
  // spawn player
  players[socket.id] = {
    x: 100 + Math.random() * 400,
    y: 100 + Math.random() * 300,
    vx: 0,
    vy: 0,
    color: `hsl(${Math.floor(Math.random()*360)}, 70%, 60%)`
  };

  // receive input (normalized dir from client)
  socket.on('input', ({dx, dy}) => {
    const p = players[socket.id];
    if (!p) return;
    p.vx = dx * SPEED;
    p.vy = dy * SPEED;
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
  });
});

// server tick -> integrate & broadcast
let last = Date.now();
setInterval(() => {
  const now = Date.now();
  const dt = (now - last) / 1000;
  last = now;

  for (const id in players) {
    const p = players[id];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    // simple bounds
    p.x = Math.max(10, Math.min(790, p.x));
    p.y = Math.max(10, Math.min(590, p.y));
  }

  io.emit('state', players);
}, TICK);

server.listen(port, '0.0.0.0', () => {
  console.log(`Server is listening on port ${port}`);
});
