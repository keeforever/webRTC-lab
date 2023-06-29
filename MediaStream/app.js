


const constraints = {
  video: true,
  audio: false
}

let stream;

const playerOne = document.getElementById("player-left")
const playerTwo = document.getElementById("player-right")

const getUserMedia = async (constraints)=>{
  try{
    stream = await navigator.mediaDevices.getUserMedia(constraints)
    playerOne.srcObject = stream
    console.log("stream", stream)
  }catch(error){
    console.log("navigator.getUserMedia error: ", error);
  }
}

getUserMedia(constraints)