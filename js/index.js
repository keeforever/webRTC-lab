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

// variables
let localStream, localPeerConnection, remotePeerConnection;

let constraints = {
  video: true,
  audio: false
}

let server = null;

let offer, answer;

let remoteDataChannel;


const getUserMedia = async (constraints) => {
  try {
    localStream = await navigator.mediaDevices.getUserMedia(constraints)
  } catch (error) {
    log(error)
  }
}

// getUserMedia(constraints)

// local signal
const localSignal = async ()=>{

  // local peer connection
  localPeerConnection = new RTCPeerConnection()

  localPeerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      offer = JSON.stringify(localPeerConnection.localDescription)
    }
  }

  // create channel
  const dataChannel = localPeerConnection.createDataChannel("senderChannel")

  dataChannel.onopen = () => {
    connectionStatusUpdate({
      type: "local",
      message: 'Opened !'
    })
  }

  dataChannel.onclose = () => {
    connectionStatusUpdate({
      type: "local",
      message: 'Closed !'
    })
  }

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

  // remote peer connection
  remotePeerConnection = new RTCPeerConnection()

  remotePeerConnection.onicecandidate = (event)=>{
    if(event.candidate){
      answer = JSON.stringify(remotePeerConnection.localDescription)
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
  if(SDPLocalTextarea.value && SDPRemoteTextarea.value){
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