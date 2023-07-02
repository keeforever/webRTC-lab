// DOMs
const SDPLocalTextarea = document.getElementById("sdp-local-textarea")
const SDPRemoteTextarea = document.getElementById("sdp-remote-textarea")

const SDPLocalCopyBtn = document.getElementById("sdp-local-copy-btn")
const SDPRemoteCopyBtn = document.getElementById("sdp-remote-copy-btn")

const SDPLocalSignalBtn = document.getElementById("sdp-local-signal-btn")
const SDPRemoteSignalBtn = document.getElementById("sdp-remote-signal-btn")

const connectionStartBtn = document.getElementById("connection-start-btn")
const connectionStopBtn = document.getElementById("connection-stop-btn")

const connectionStatusLocal = document.getElementById("connection-local-status")
const connectionStatusRemote = document.getElementById("connection-remote-status")


const messageSendBtnLocal = document.getElementById("message-local-send-btn")
const messageSendBtnRemote = document.getElementById("message-remote-send-btn")


const messageInputRemote = document.getElementById("text-input-remote")
const messageOutputRemote = document.getElementById("text-output-remote")

const messageInputLocal = document.getElementById("text-input-local")
const messageOutputLocal = document.getElementById("text-output-local")

const videoPlayerLocal = document.getElementById("video-player-local")
const videoPlayerRemote = document.getElementById("video-player-remote")

// variables
let localStream, localPeerConnection, remotePeerConnection;

let constraints = {
  video: true,
  audio: false
}

let server = null;

let offer, answer;

// channel
let localDataChannel, remoteDataChannel;


const getUserMedia = async (constraints) => {
  try {
    localStream = await navigator.mediaDevices.getUserMedia(constraints)
  } catch (error) {
    log(error)
  }
}

getUserMedia(constraints)

//peer connection
localPeerConnection = new RTCPeerConnection()
remotePeerConnection = new RTCPeerConnection()

// local signal
const localSignal = async ()=>{

  localPeerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      offer = JSON.stringify(localPeerConnection.localDescription)
    }
  }

  // create channel
  localDataChannel = localPeerConnection.createDataChannel("senderChannel")

  localDataChannel.onopen = () => {
    connectionStatusUpdate({
      type: "local",
      message: 'Opened !'
    })
  }

  localDataChannel.onclose = () => {
    connectionStatusUpdate({
      type: "local",
      message: 'Closed !'
    })
  }

  localDataChannel.onmessage = (event)=>{
    messageOutputLocal.value = event.data
  }


  // add video track
  for (track of localStream.getTracks()) {
    localPeerConnection.addTrack(track, localStream)
  }

  videoPlayerLocal.srcObject = localStream

  // create offer
  try {
    offer = await localPeerConnection.createOffer()
    localPeerConnection.setLocalDescription(offer)
  } catch (error) {
    console.log(error)
  }
}


// remote signal
const remoteSignal = async ()=>{

  if(!SDPRemoteTextarea.value){
    return alert("Local SDP Required !")
  }


  remotePeerConnection.onicecandidate = (event)=>{
    if(event.candidate){
      answer = JSON.stringify(remotePeerConnection.localDescription)
    }
  }

  // remote video track
  remotePeerConnection.ontrack = (event)=>{

    if(event.streams && event.streams[0]){
      videoPlayerRemote.srcObject = event.streams[0]
    }

  }

  // remote channel
  remotePeerConnection.ondatachannel = (event)=>{
    remoteDataChannel = event.channel
    
    remoteDataChannel.onopen = ()=>{
      connectionStatusUpdate({
        type: "remote",
        message: 'Opened !'
      })
    }

    remoteDataChannel.onclose = ()=>{
      connectionStatusUpdate({
        type: "remote",
        message: 'Closed !'
      })
    }

    remoteDataChannel.onmessage = (event)=>{
      messageOutputRemote.value = event.data
    }

  }

  remotePeerConnection.setRemoteDescription(JSON.parse(SDPRemoteTextarea.value))

  // create answer
  try {
    answer = await remotePeerConnection.createAnswer()
    remotePeerConnection.setLocalDescription(answer)
  } catch (error) {
    console.log(error)
  }
}

// start and stop - buttons
const start = async () => {
  if(SDPLocalTextarea.value ){
    localPeerConnection.setRemoteDescription(JSON.parse(SDPLocalTextarea.value))
    return
  }
  alert("Remote SDP Required !")
}

const stop = ()=>{
  localPeerConnection.close()
  remotePeerConnection.close()

  offer = null
  answer = null
  localPeerConnection = null
  remotePeerConnection = null

  SDPLocalTextarea.value = ''
  SDPRemoteTextarea.value = ''

  localStream.removeTrack(localStream.getTracks()[0])

  connectionStopBtn.disabled = true
}

connectionStartBtn.onclick = start
connectionStopBtn.onclick = stop

// signal buttons
SDPLocalSignalBtn.onclick = localSignal
SDPRemoteSignalBtn.onclick = remoteSignal


// local and remote sdp copy button
SDPLocalCopyBtn.onclick = ()=>{
  if(offer){
    navigator.clipboard.writeText(offer)
    return
  }
  alert("Signal required!")
}

SDPRemoteCopyBtn.onclick = ()=>{
  if(answer){
    navigator.clipboard.writeText(answer)
    return
  }
  alert("Signal required!")
}

// texting 
const sendMessageFromLocal = ()=>{
  const message = messageInputLocal.value
  localDataChannel.send(message)
}

const sendMessageFromRemote = ()=>{
  const message = messageInputRemote.value
  remoteDataChannel.send(message)
}

messageSendBtnLocal.onclick = sendMessageFromLocal
messageSendBtnRemote.onclick = sendMessageFromRemote

function log(text) {
  console.log(text)
}

function connectionStatusUpdate ({type, message}){

  if(type == "local"){
    connectionStatusLocal.innerHTML =  "Local Status : " + message
  }

  if(type == "remote"){
    connectionStatusRemote.innerHTML =  "Remote Status : " + message
  }
}
