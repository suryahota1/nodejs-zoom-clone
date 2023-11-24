const videoEleId = "video-grid";
const messageEle = document.getElementById("chat-message");
const messageContainerEle = document.getElementById("messages");
const mainChatWindow = document.getElementById("chat-sec");

const socket = io("ws://localhost:5002");
var peer = new Peer(undefined, {
    path: "/peerjs", 
    host: "/", 
    port: "443"
});

let myVideoStream;
const otherUserIds = [];
let recievedCalls = [];

const getVideoEle = () => {
    const myVideo = document.createElement("video");
    myVideo.muted = true;
    myVideo.width = 400;
    myVideo.height = 500;
    myVideo.controls = true;
    return myVideo;
}

navigator.mediaDevices.getUserMedia({
    video: true, 
    audio: true
}).then(stream => {
    console.log("User allowed access");
    myVideoStream = stream;
    addVideoStream(getVideoEle(), stream);
    console.log();
    if ( recievedCalls.length > 0 ) {
        recievedCalls.forEach(call => answerToCall(call));
        recievedCalls = [];
    }
}).catch(err => {
    console.log("User denied access", err);
});

const addVideoStream = ( video, stream ) => {
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
        video.play();
    });
    document.getElementById(videoEleId).appendChild(video);
}

const connectNewUser = ( userId, stream ) => {
    console.log("connectNewUser userId", userId);
    const call = peer.call(userId, stream);
    const video = getVideoEle();
    call.on("stream", userVideoStream => {
        console.log("userVideoStream", userVideoStream);
        addVideoStream(video, userVideoStream);
    });
}

peer.on("open", id => {
    console.log("id ------------------", id);
    socket.emit("join-room", ROOM_ID, id);
});

socket.on("user-connected", ( userId ) => {
    console.log("user connected", userId);
    console.log("user connected myVideoStream", myVideoStream);
    if ( myVideoStream ) {
        connectNewUser(userId, myVideoStream);
    } else {

    }
});

const answerToCall = ( call ) => {
    call.answer(myVideoStream);
    const video = getVideoEle();
    call.on("stream", userVideoStream => {
        addVideoStream(video, userVideoStream);
    });
}

peer.on('call', function( call ) {
    console.log("recieved call", call);
    console.log("recieved myVideoStream", myVideoStream);
    if ( myVideoStream ) {
        answerToCall(call);
    } else {
        recievedCalls.push(call);
    }
});

messageEle.addEventListener("keypress", e => {
    let { target: { value="" }, code } = e;
    value = value.trim();
    if ( code === "Enter" && value ) {
        messageEle.value = "";
        appendMessage(value);
        socket.emit("message", ROOM_ID, value);
    }
});

socket.on("create-message", messageText => {
    console.log("message recieved", messageText);
    appendMessage(messageText);
});

const appendMessage = ( text ) => {
    const liEle = document.createElement("li");
    liEle.classList.add("message");
    const bEle = document.createElement("b");
    bEle.innerText = "User";
    const spEle = document.createElement("span");
    spEle.innerText = text;
    const brEle = document.createElement("br");
    liEle.append(bEle, brEle, spEle);

    messageContainerEle.appendChild(liEle);
    scrollToBottom(mainChatWindow);
}

const scrollToBottom = ( e ) => {
    e.scrollTop = e.scrollHeight;
}

const setUnmuteButton = () => {
    document.getElementById("mute-unmute-button").innerHTML = `
        <span>
            <i class="fa-solid fa-microphone-slash"></i>
        </span>
        <span>
            Unmute
        </span>
    `;
}

const setMuteButton = () => {
    document.getElementById("mute-unmute-button").innerHTML = `
        <span>
            <i class="fa-solid fa-microphone"></i>
        </span>
        <span>
            Mute
        </span>
    `;
}

const muteUnmute = () => {
    const isEnabled = myVideoStream.getAudioTracks()[0].enabled;
    if ( isEnabled ) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        setUnmuteButton();
    } else {
        myVideoStream.getAudioTracks()[0].enabled = true;
        setMuteButton();
    }
}

const setStopButton = () => {
    document.getElementById("stop-play-video").innerHTML = `
        <span>
            <i class="fa-solid fa-video"></i>
        </span>
        <span>
            Stop Video
        </span>
    `;
}

const setPlayButton = () => {
    document.getElementById("stop-play-video").innerHTML = `
        <span>
            <i class="fa-solid fa-video-slash"></i>
        </span>
        <span>
            Play Video
        </span>
    `;
}

const stopPlayVideo = () => {
    const isEnabled = myVideoStream.getVideoTracks()[0].enabled;
    if ( isEnabled ) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        setPlayButton();
    } else {
        myVideoStream.getVideoTracks()[0].enabled = true;
        setStopButton();
    }
}