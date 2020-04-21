window.addEventListener('load', () => {
  // socket stuff
  const io = require('socket.io-client');
  const { v4: uuidv4 } = require('uuid');
  const { connect } = require('twilio-video');
  const socket = io.connect();

  let username;
  let token;
  const identity = uuidv4();
  const color = Math.floor(Math.random()*16777215).toString(16);

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
    const li = `<li style="color: #${color};"><small><b><i class="far fa-user"></i> ${username}:</b> ${message}</small></li>`
    messagesDiv.insertAdjacentHTML('beforeend', li);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
  socket.on('errorMsg', (msg) => {
    alert(msg);
  });

  (async function getAccessToken() {
    //TODO - add getting token loader..
    try {
      let response = await fetch(`/generate-token/${RoomFromLink}/${identity}`);
      let data = await response.json();
      console.log('fetch', data);
      token = data.jwt;
    } catch(e) {
      console.error('Err', e);
    }
  })();

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
    connect(
      token,
    { 
      name: RoomFromLink.toString(),
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
    console.error('catch', error);
    console.error(`Unable to connect to Room: ${error.message}`);
  });
  
    function participantConnected(participant) {
      console.log('Participant "%s" connected identity', participant.identity);
    
      participant.on('trackSubscribed', track => {
        console.log('sub',track)
        if (track.kind === 'video') {
          const vid = document.getElementById('vid');
          vid.innerHTML = ``;
          vid.style.backgroundColor = ""
          vid.style.backgroundColor = "black";
          vid.appendChild(track.attach());
          document.querySelector('#vid video').controls = true;
          vid.children[0].controls = true;
        }

        if (track.kind === 'audio') {
          const aud = document.getElementById('aud');
          aud.innerHTML = ``;
          aud.appendChild(track.attach());
          document.querySelector('#aud audio').controls = true;
          aud.children[0].controls = true;
        }
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