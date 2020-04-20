const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000;

//init app
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

let users = [];
let rooms = [];

io.on('connection', (socket) => {
  users.push(socket.id);
  console.log(`${users.length} users connected`);

  socket.on('createChatRoom', ({ room }) => {
    console.log(room);
    rooms.push(room);
    socket.join(room);
    io.sockets.in(room).emit('roomCreated', true);
  });

  socket.on('joinRoom', ({ room, username, color}) => {
    if (rooms.includes(room)) {
      socket.join(room);
      io.sockets.in(room).emit('message', {
        username,
        message: `joined the stream`,
        color
      });
    } else {
      socket.emit('errorMsg', 'Room doesn\'t exist, invalid URL')
    }
  });

  socket.on('sendChatMessage', ({ room, username, message, color}) => {
    console.log(room, username, message, color);
    if (rooms.includes(room)) {
      io.sockets.in(room).emit('message', {
        username,
        message,
        color
      })
    }
  });

  socket.on('disconnect', () => {
    users.splice(socket.id, 1);
    console.log(`user disconnected, ${users.length} left`);
  })
});

// static assets
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.static(path.join(__dirname + '/node_modules/sketchpad/scripts')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/remote/:roomId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'remote.html'));
});

http.listen(PORT, console.log(`server started on port ${PORT}`));