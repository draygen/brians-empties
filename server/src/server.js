const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);

const port = process.env.PORT || 3000;

app.use(cors());

// Serve the built client
const clientDist = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDist));

// SPA fallback (put API routes above this)
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

io.on('connection', (socket) => {
  console.log('A user connected', socket.id);
  socket.on('disconnect', () => console.log('User disconnected', socket.id));
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Server is listening on port ${port}`);
});
