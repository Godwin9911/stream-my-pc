window.addEventListener('load', () => {
  'use strict'
  // socket stuff
  const io = require('socket.io-client');
  // const html2canvas = require('html2canvas');
  const { v4: uuidv4 } = require('uuid');
  const { connect, LocalVideoTrack, LocalAudioTrack } = require('twilio-video');
  const socket = io.connect();

  const username = 'Host';
  const color = Math.floor(Math.random()*16777215).toString(16);
  const roomName = uuidv4();
  let URL = window.URL || window.webkitURL;

  const screenCaptureBtn = document.querySelector('#screenCaptureBtn');
  const cameraCaptureBtn = document.querySelector('#cameraCaptureBtn');
  const whiteboardCapture = document.querySelector('#whiteboardCapture');
  const sendMsgForm = document.querySelector('#sendMsgForm');
  const messagesDiv = document.querySelector('#messages');
  let stream;
  let videoNode;
  let sketchpad;
  const currentStream = document.querySelector('#currentStream');
  const canvas = document.querySelector('#canvas-div');

  (function resize (){
    sketchpad = new Sketchpad({
    element: '#sketchpad',
    width: currentStream.offsetWidth - 20,
    height: 380,
  });
  sketchpad.color = '#fff';
  })();

  const stopCapture = () => {
    try {
      let tracks = videoNode.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoNode.srcObject = null;
    } catch(e) {
      console.error('Err', e);
    }
  }
  

  const displayMessage = (message, isError = false) => {
    let element = document.querySelector('#message');
    element.innerHTML = message;
    element.className = isError ? 'error' : 'info';
  }

  const displaySocketMessage = (message, isError = false) => {
    let element = document.querySelector('#socketMessage');
    element.innerHTML = message;
    element.className = isError ? 'error' : 'info';
  }

  // socket emit  ---------------------------------
  const createChatRoom = () => {
    socket.emit('createChatRoom', {
      room: roomName
    });
  }

  const sendChatMessage = (message) => {
    socket.emit('sendChatMessage', {
      room: roomName,
      username,
      message,
      color
    });
  }

  // sockets on -----------------------------------
  socket.on('roomCreated', (data) => {
    console.log('roomcreated', data);
    displaySocketMessage(`room created ${data}`)
  });

  socket.on('message', ({username, message, color}) => {
    const li = `<li style="color: #${color};"><small><b>${username}:</b> ${message}</small></li>`
    messagesDiv.insertAdjacentHTML('beforeend', li);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });

  socket.on('errorMsg', (msg) => {
    alert(msg);
  });



  function playSelectedFile(e){
    currentStream.innerHTML = `<video controls autoplay></video>`;
    videoNode = document.querySelector('#currentStream > video');
    const file = this.files[0];
    const type = file.type;
    const canPlay = videoNode.canPlayType(type);
    // console.log('canplay',canPlay);

    if (canPlay === '') canPlay = 'no'
    const message = `can play type ${type}`;
    const isError = canPlay === 'no' 
    displayMessage(message, isError);

    if (isError) return;

    const fileUrl = URL.createObjectURL(file);
    videoNode.src = fileUrl;
    stream = videoNode.captureStream();
  }

  const startStream = async () => {
    // TODO - check if video is loaded;
    console.log('stream', stream);
    
    const screenLocalTrack = new LocalVideoTrack(stream.getVideoTracks()[0]);
    const audioLocalTrack = new LocalAudioTrack(stream.getAudioTracks()[0]);
    console.log(screenLocalTrack);
    console.log(audioLocalTrack);

    // TODO - get token from backend
    const room = await connect(
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiIsImN0eSI6InR3aWxpby1mcGE7dj0xIn0.eyJqdGkiOiJTSzQxZmU5NWUxYjRlZGVjZDdkYTJiMzRmNDM5MTIyN2RkLTE1ODczMjM2MDUiLCJpc3MiOiJTSzQxZmU5NWUxYjRlZGVjZDdkYTJiMzRmNDM5MTIyN2RkIiwic3ViIjoiQUMzZmRlODA3YzRkNGE4MWJhODQ2MjA3YWIxY2U0NTU4YiIsImV4cCI6MTU4NzMyNzIwNSwiZ3JhbnRzIjp7ImlkZW50aXR5IjoicGMxIiwidmlkZW8iOnsicm9vbSI6InJvb20xIn19fQ.oUJKwwpbQvTRKJxFKv1BoOOaETYe4SMTqoXFnDJ6M_U',
    {
      name: 'room1',
      tracks: [screenLocalTrack, audioLocalTrack]
    });

    room.on('participantConnected', participant => {
      console.log(`A remote Participant connected: ${participant}`);
    
      participant.on('trackSubscribed', track => {
        console.log('sub', track);
        if (track.kind === 'data') {
          track.on('message', (message) => {
            console.log('message', message );
          });
        }
      });
  
      participant.on('trackUnsubscribed', track => console.log('unsub', track));
    
      participant.on('trackAdded', track => {
        console.log('add', track);
        console.log(`Participant "${participant.identity}" added ${track.kind} Track ${track.sid}`);
        /*if (track.kind === 'data') {
          track.on('message', data => {
            console.log(data);
          });
        }
        */
        
      });
    });
  
    screenLocalTrack.once('stopped', () => {
      room.localParticipant.unpublishTrack(screenLocalTrack);
    });

    generateLink(); 
    createChatRoom();
  }

  const generateLink = () => {
    const link = `${window.location.origin}\/remote/${roomName}`;
    displayMessage(`<b>sharable link:</b> <a href="${link}" target="_blank">${link}</a>`, false);
  }
  //---------------------------------------------------
 
  const inputNode = document.querySelector('input');
  const startStreamButton = document.querySelector('#startStream');
  const addYoutubeStreamLink = document.querySelector('#addYoutubeStreamLink');
  const modal = document.querySelector('.modal');

  inputNode.addEventListener('change', playSelectedFile, false);
  startStreamButton.addEventListener('click', startStream);
  addYoutubeStreamLink.addEventListener('click', (e) => {
    modal.classList.add('d-block');
  });

  document.querySelector('#youtubeLinkForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const youtubeLinkInput = document.getElementById('youtubeLinkInput').value;
    const parser = document.createElement('a');
    parser.href = youtubeLinkInput;
    const vidLink = parser.pathname.split('/')[1];
    
    const iframe = `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${vidLink}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
    currentStream.innerHTML = iframe;
    const selectIframe = document.querySelector('#currentStream iframe');
    
    selectIframe.addEventListener('load', (e) => {
      //let iframeVid = document.querySelector("iframe");
      //console.log(iframeVid.contentWindow);
      /*let ctx = canvas.getContext('2d');
      setInterval(() => {
        ctx.drawImage(selectIframe, 5, 5, selectIframe.width, selectIframe.height);
      }, 20);
      */
    })
    modal.classList.remove('d-block');
    // set stream object
    // startStream();
  });

  cameraCaptureBtn.addEventListener('click', async (e) => {
    stopCapture();
    canvas.classList.add('d-none');
    let options = {
      video: {width: {exact: 1280}, height: {exact: 720}},
      audio: true
    };
    try {
      stream = await navigator.mediaDevices.getUserMedia(options);
      currentStream.innerHTML = `<video autoplay></video>`;
      videoNode = document.querySelector('#currentStream > video');
      videoNode.srcObject = stream;
    } catch (err) {
      console.error("Error: " + err);
    }
  });

  screenCaptureBtn.addEventListener('click', async (e) => {
    stopCapture();
    canvas.classList.add('d-none');
    let displayMediaOptions = {
      video: {
        cursor: "always"
      },
      audio: true
    };
    try {
      stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
      currentStream.innerHTML = `<video controls autoplay></video>`;
      videoNode = document.querySelector('#currentStream > video');
      videoNode.srcObject = stream;
    } catch (err) {
      console.error("Error: " + err);
    }
  });

  whiteboardCapture.addEventListener('click', (e) => {
    stopCapture();
    sketchpad = new Sketchpad({
    element: '#sketchpad',
    width: currentStream.offsetWidth - 20,
    height: 380,
    });
    currentStream.innerHTML = ``;
    canvas.classList.remove('d-none');
    document.querySelector('#undo').addEventListener('click', (e) => {
      sketchpad.undo()
    });
  
    document.querySelector('#redo').addEventListener('click', (e) => {
      sketchpad.redo()
    });

    document.querySelector('#color-picker').addEventListener('change', (e) => {
      sketchpad.color = e.target.value;
    });

    document.querySelector('#size-picker').addEventListener('change', (e) => {
      sketchpad.penSize = parseInt(e.target.value);
    });
  });

  sendMsgForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const chatMessage = document.getElementById('chatMessageInput').value;
    sendChatMessage(chatMessage);
  });


});