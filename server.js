const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const PORT = process.env.PORT || 5000;
const AccessToken = require('twilio').jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;
//init app
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

let users = [];
let rooms = [];

io.on('connection', (socket) => {
  users.push(socket.id);
  // console.log(`${users.length} users connected`);

  socket.on('createChatRoom', ({ room }) => {
    // console.log(room);
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
    // console.log(room, username, message, color);
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
    // console.log(`user disconnected, ${users.length} left`);
  })
});

// static assets
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/remote/:roomId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'remote.html'));
});

app.get('/generate-token/:roomname/:identity' , (req, res) => {
  // Substitute your Twilio AccountSid and ApiKey details
  const ACCOUNT_SID = process.env.ACCOUNT_SID;
  const API_KEY_SID = process.env.API_KEY_SID;
  const API_KEY_SECRET = process.env.API_KEY_SECRET;

  // Set the Identity of this token
  identity = req.params.identity;

  // Grant access to Video
  const grant = new VideoGrant({
    room: req.params.roomname
  });

  // Create an Access Token
  token = new AccessToken(
    ACCOUNT_SID,
    API_KEY_SID,
    API_KEY_SECRET,
  );
  token.addGrant(grant);
  token.identity = identity;

  // Serialize the token as a JWT
  const jwt = token.toJwt();
  res.status(200).json({ jwt });
});

http.listen(PORT, console.log(`server started on port ${PORT}`));