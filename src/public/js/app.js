const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");
const call = document.getElementById("call");

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;

async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(devices => devices.kind === "videoinput");
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId
      option.innerText = camera.label;
      if (currentCamera.label === camera.label) {
        option.selected = true;
      }
      camerasSelect.appendChild(option);
    })
    console.log(cameras);
  } catch (e) {
    console.log(e);
  }
}

async function getMedia(deviceId) {
  const initialConstrains = {
    audio: false,
    video: {facingMode: "user"},
  }
  const cameraConstraints = {
    audio: true,
    video: {deviceId: {except: deviceId}},
  }
  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? cameraConstraints : initialConstrains
    );
    myFace.srcObject = myStream;
    if (!deviceId) {
      await getCameras();
    }
  } catch (err) {
    console.log(err);
  }
}

function handleMuteClick() {
  myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (!muted) {
    muteBtn.innerText = "음소거 해제";
    muted = true;
  } else {
    muteBtn.innerText = "음소거";
    muted = false;
  }
}

function handleCameraClick() {
  myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (cameraOff) {
    cameraBtn.innerText = "카메라 off";
    cameraOff = false;
  } else {
    cameraBtn.innerText = "카메라 on";
    cameraOff = true;
  }
}

async function handleCameraChange() {
  await getMedia(camerasSelect.value);
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange)

// Welcome Form (join a room)
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

async function startMedia() {
  welcome.hidden = true;
  call.hidden = false;
  await getMedia();
  makeConnection();
}

function handleWelcomeSubmit(event) {
  event.preventDefault();
  const input = welcomeForm.querySelector("input");
  socket.emit("join_room", input.value, startMedia);
  roomName = input.value;
  input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// socket code

socket.on("welcome", async () => {
  const offer = await myPeerConnection.createOffer();
  await myPeerConnection.setLocalDescription(offer);
  console.log("offer 전송");
  socket.emit("offer", offer, roomName);
});

socket.on("offer", offer => {
  console.log(offer);
})

// RTC code

function makeConnection() {
  myPeerConnection = new RTCPeerConnection();
  myStream
    .getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream));
}