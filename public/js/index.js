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
  const inputNode = document.querySelector('input');
  const startStreamButton = document.querySelector('#startStream');
  const stopStream = document.querySelector('#stopStream');
  const addYoutubeStreamLink = document.querySelector('#addYoutubeStreamLink');
  const modal = document.querySelector('.modal');

  let testVid = document.getElementById('testVid');
  let stream;
  let audioStream;
  let videoNode;
  let initialCanvas = false;
  // let sketchpad;
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

  function initSketchpad() {
    //create sketchpad on #sketchpad element
    let sketchpad = new Sketchpad({
        containerEl: document.getElementById("sketchpad"),
        createPageConfig: {
          no: 1
        }
    });
    // avaliable tools `src/sketchpad.tool.*.js`, ex. "pen", "colouring", "line", "rect", "circ"...
    let toolId = "pen";
    let tool = sketchpad.setTool(toolId).getCurrentTool();

    //create colorpalette on #colorpalette element
    let colorpalette = new Colorpalette({
        containerEl: document.getElementById("colorpalette")
    }).on("change", function (e) { //bind on change event
        sketchpad.setTool(toolId).getCurrentTool().setColor(e.color.red, e.color.green, e.color.blue, e.color.alpha);
    }).setColor(tool.setColor(247, 56, 89, 1).getColor()); //set default color

    // bind on change size event
    document.getElementById("size").addEventListener("change", function (e) {
        sketchpad.getCurrentTool().setSize(e.target.value);
    });
    document.getElementById("size").value = tool.setSize(2).getSize();//set default size

    // bind eraser button
    document.getElementById('eraser').addEventListener("click", function () {
        sketchpad.setTool("eraser");
    });

    console.log(colorpalette);

    //make objects below visible in global scope
    window.sketchpad = sketchpad;
    window.colorpalette = colorpalette;
    window.tool = tool;
  }

  const stopCapture = () => {
    const videoNode = document.querySelector('#currentStream > video');
    try {
      if (audioStream) {
        const audio = audioStream.getTracks();
        audio.forEach(track => track.stop());
      }

      if (stream) {
        let tracks = videoNode.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        videoNode.srcObject = null;
      }
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
    canvas.classList.add('d-none');
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
      displayMessage('starting stream, please wait...')

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
      console.error(`Unable to connect to Room: ${e.message}`);
      displayMessage(`Unable to connect to Room: ${e.message}`);
    }
  }

  const generateLink = () => {
    const link = `${window.location.origin}\/remote/${roomName}`;
    displayMessage(`<b>sharable link:</b> <a href="${link}" target="_blank">${link}</a>`, false);
  }

  //--------------------------------------------------
  inputNode.addEventListener('change', playSelectedFile, false);
  startStreamButton.addEventListener('click', (e) => {
    startStream('localVideo');
  });
  stopStream.addEventListener('click', (e) => {
    stopCapture();
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
    stopCapture();
    currentStream.innerHTML = ``;
    canvas.classList.remove('d-none');
    initSketchpad();
    audioStream = await navigator.mediaDevices.getUserMedia({audio: true, video: false});
    stream = document.querySelector('#canvas').captureStream();

    // TODO - click here to begin your stream;
    const startCanvasStream = document.querySelector('#startCanvasStream');
    // touch end.

    window.tool.setSize(5000);
    window.tool.setColor(255 , 255 , 255, 1);

    startCanvasStream.addEventListener('click', (e) => {
      if (!initialCanvas) {
        window.tool.setSize(2);
        window.tool.setColor(0, 0, 0, 1);
        initialCanvas = true;
      }
    });
    startStream('canvas');
  });

  sendMsgForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const chatMessage = document.getElementById('chatMessageInput').value;
    sendChatMessage(chatMessage);
  });


});