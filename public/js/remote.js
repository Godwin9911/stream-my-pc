window.addEventListener('load', () => {
  // socket stuff
  const io = require('socket.io-client');
  const socket = io.connect();

  let username;
  const color = Math.floor(Math.random()*16777215).toString(16);

  const { connect } = require('twilio-video');

  const parser = document.createElement('a');
  parser.href = window.location;
  const RoomFromLink = parser.pathname.split('/')[2];
  // console.log(RoomFromLink);
  
  const usernameForm = document.getElementById('usernameForm');
  const currentuser = document.querySelector('#currentUser');
  const modal = document.querySelector('.modal');
  const sendMsgForm = document.querySelector('#sendMsgForm');
  const messagesDiv = document.querySelector('#messages');

  // socket emit  ---------------------------------
  const sendChatMessage = (message) => {
    socket.emit('sendChatMessage', {
      room: RoomFromLink,
      username,
      message,
      color
    });
  }

  // sockets on -----------------------------------
  socket.on('message', ({username, message, color}) => {
    const li = `<li style="color: #${color};"><small><b>${username}:</b> ${message}</small></li>`
    messagesDiv.insertAdjacentHTML('beforeend', li);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });

  socket.on('errorMsg', (msg) => {
    alert(msg);
  });

  usernameForm.addEventListener('submit', (e) => {
    e.preventDefault();
    username = document.getElementById('usernameInput').value;
    currentuser.textContent = username;
    modal.classList.add('d-none');
    // join room
    socket.emit('joinRoom', {
      room: RoomFromLink,
      username,
      color
    });

    joinstream();
  });

  const joinstream = () => {
    connect('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiIsImN0eSI6InR3aWxpby1mcGE7dj0xIn0.eyJqdGkiOiJTSzQxZmU5NWUxYjRlZGVjZDdkYTJiMzRmNDM5MTIyN2RkLTE1ODczMjM3NjMiLCJpc3MiOiJTSzQxZmU5NWUxYjRlZGVjZDdkYTJiMzRmNDM5MTIyN2RkIiwic3ViIjoiQUMzZmRlODA3YzRkNGE4MWJhODQ2MjA3YWIxY2U0NTU4YiIsImV4cCI6MTU4NzMyNzM2MywiZ3JhbnRzIjp7ImlkZW50aXR5IjoicGMyIiwidmlkZW8iOnsicm9vbSI6InJvb20xIn19fQ.1iJobZsaOLSiewtxAjg3tWeWXT3SP3mxW9ct2R4Vqbw',
    { 
      name: 'room1',
      tracks: []
    })
   .then(room => {
    console.log('Connected to Room "%s"', room.name);
  
    // log participants in room
    room.participants.forEach(participantConnected);
    room.on('participantConnected', participantConnected);

    // Log new Participants as they connect to the Room
    room.once('participantConnected', participant => {
      console.log(`Participant "${participant.identity}" has connected to the Room`);
    });

    // Log Participants as they disconnect from the Room
    room.once('participantDisconnected', participant => {
      console.log(`Participant "${participant.identity}" has disconnected from the Room`);
    });
  
    room.on('participantDisconnected', participantDisconnected);
    room.once('disconnected', error => room.participants.forEach(participantDisconnected));
  
  }, error => {
    console.error(`Unable to connect to Room: ${error.message}`);
  });
  
    function participantConnected(participant) {
      console.log('Participant "%s" connected identity', participant.identity);
    
      participant.on('trackSubscribed', track => {
        console.log('sub',track)
        document.getElementById('vid').appendChild(track.attach());
        document.querySelector('#vid video').controls = true;
        // document.querySelector('#vid audio').controls = true;
      });
      
      participant.on('trackUnsubscribed', track => console.log('unsub', track));
    
      participant.tracks.forEach(publication => {
        if (publication.isSubscribed) {
          console.log('track-sub', publication.track);
        }
      });
    }

    function participantDisconnected(participant) {
      console.log('Participant "%s" disconnected', participant.identity);
    }
  }

  sendMsgForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const chatMessage = document.getElementById('chatMessageInput').value;
    sendChatMessage(chatMessage);
  });
});