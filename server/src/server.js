const express = require('express');
const cors = require('cors');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const port = process.env.PORT || 3000;

app.use(cors());
app.get('/', (req, res) => {
  res.send('Server is running!');
});

io.on('connection', (socket) => {
  console.log('A user connected');
});

http.listen(port, '0.0.0.0', () => {
  console.log(`Server is listening on port ${port}`);
});
