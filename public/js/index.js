window.addEventListener('load', () => {
  'use strict'
  // socket stuff
  const io = require('socket.io-client');
  // const html2canvas = require('html2canvas');
  const { v4: uuidv4 } = require('uuid');
  const { connect, LocalVideoTrack, LocalAudioTrack } = require('twilio-video');
  const socket = io.connect();

  const username = 'Host';
  const identity = uuidv4();
  const color = Math.floor(Math.random()*16777215).toString(16);
  const roomName = uuidv4();
  let URL = window.URL || window.webkitURL;

  const screenCaptureBtn = document.querySelector('#screenCaptureBtn');
  const cameraCaptureBtn = document.querySelector('#cameraCaptureBtn');
  const whiteboardCapture = document.querySelector('#whiteboardCapture');
  const sendMsgForm = document.querySelector('#sendMsgForm');
  const messagesDiv = document.querySelector('#messages');
  const currentStream = document.querySelector('#currentStream');
  const canvas = document.querySelector('#canvas-div');

  let testVid = document.getElementById('testVid');
  let stream;
  let audioStream;
  let videoNode;
  let sketchpad;
  let token;

  (async function getAccessToken() {
    //TODO - add getting token loader..
    try {
      let response = await fetch(`/generate-token/${roomName}/${identity}`);
      let data = await response.json();
      console.log('fetch', data);
      token = data.jwt;
    } catch(e) {
      console.error('Err', e);
    }
  })();

  (function resize (){
    sketchpad = new Sketchpad({
    element: '#sketchpad',
    width: 710,
    height: 380,
  });
  // sketchpad.color = '#fff';
  })();

  const stopCapture = () => {
    try {
      audioStream = null;
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
    const li = `<li style="color: #${color};"><small><b><i class="far fa-user"></i> ${username}:</b> ${message}</small></li>`
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

    if (canPlay === '') canPlay = 'no'
    const message = `can play type ${type}`;
    const isError = canPlay === 'no' 
    displayMessage(message, isError);

    if (isError) return;

    const fileUrl = URL.createObjectURL(file);
    videoNode.src = fileUrl;
    stream = videoNode.captureStream();
  }

  const startStream = async (streamType = 'default') => {

    try {

      let tracks = [];
      const mic = (audioStream) ? new LocalAudioTrack(audioStream.getAudioTracks()[0]) : null;
      const audioLocalTrack = (stream.getAudioTracks()[0]) ? new LocalAudioTrack(stream.getAudioTracks()[0]) : null;
      const screenLocalTrack = (stream.getVideoTracks()[0]) ? new LocalVideoTrack(stream.getVideoTracks()[0]) : null;
      
      if (screenLocalTrack) {
        tracks.push(screenLocalTrack);
      }
      if (audioLocalTrack) {
        tracks.push(audioLocalTrack);
      }
      if (mic) {
        tracks.push(mic);
      }

      const options = {
        name: roomName.toString(),
        tracks
      }

      console.log(tracks);
      const room = await connect(token, options);

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

    } catch (e) {
      console.error('catch', e.name);
      console.error(`Unable to connect to Room: ${e.message}`);
    }
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
  startStreamButton.addEventListener('click', (e) => {
    startStream('localVideo');
  });
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
      console.log('camera',stream);
      currentStream.innerHTML = `<video autoplay></video>`;
      videoNode = document.querySelector('#currentStream > video');
      videoNode.srcObject = stream;
      startStream();
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
      // testVid.srcObject = stream;
      //clonedStream = testVid.captureStream();
      
      startStream('screenCapture');
    } catch (err) {
      console.error("Error: " + err);
    }
  });

  whiteboardCapture.addEventListener('click', async (e) => {
    // alert(currentStream.offsetWidth);
    stopCapture();
    /*sketchpad = new Sketchpad({
      element: '#sketchpad',
      width: 710,
      height: 380,
    });
    */
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

    audioStream = await navigator.mediaDevices.getUserMedia({audio: true, video: false});
    stream = canvas.firstElementChild.captureStream();
    //testVid.srcObject = audioStream;
    startStream('canvas');
    let can = canvas.firstElementChild;
    let ctx = can.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, can.width, can.height);
  });

  sendMsgForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const chatMessage = document.getElementById('chatMessageInput').value;
    sendChatMessage(chatMessage);
  });


});