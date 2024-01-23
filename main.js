import dotenv from 'dotenv';

dotenv.config();

let APP_ID = process.env.APP_ID;
let token = null;

let uid = String(Math.floor(Math.random() * 10000));



// Check this https://miro.medium.com/v2/resize:fit:1100/format:webp/1*H3OHwZjc2kRyAnv7gaF1Ug.png
let queryString = window.location.search
let urlParams = new URLSearchParams(queryString)
let roomId = urlParams.get('room')

if(!roomId){
    window.location = 'DashBoard.html'
}

let client; 
let room;// room for users to join helps us to send messages

let my_stream;
let client_stream;
let peerConnection;


//peerConnection is the one that stores all the information about us and client 

const servers = {
    iceServers:[
        {
            urls:['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
        }
    ]
}
let Configs = {
    video:{
        width:{min:640, ideal:1920, max:1920},
        height:{min:480, ideal:1080, max:1080},
    },
    audio:true
}

//stun server provides a common public Ip adress for both peers to communicate without server 
let opened=async()=>{
   //This instance allows your application to interact with Agora's RTM service
    client =await AgoraRTM.createInstance(APP_ID);
    await client.login({uid,token});
    room=client.createChannel(roomId)
    await room.join();
    room.on('MemberJoined',handleUserJoined);
    room.on('MemberLeft',handleUserLeft);
    client.on('MessageFromPeer',handleMessageFromPeer);

    my_stream= await navigator.mediaDevices.getUserMedia(Configs);
    document.getElementById("user-1").srcObject=my_stream;
// The navigator object contains information about the browser.
// method prompts the user for permission to use up to one video input device (such as a camera or shared screen) and up to one audio input device (such as a microphone) as the source for a 
// In summary, use the src attribute when dealing with static media files, and use the srcObject property when working with dynamic, real-time media streams,

}

//here handleUserJoined means that when a user joins only then we will create a offer
let handleUserJoined=async(MemberId)=>{
console.log("New user joined",MemberId);
creating_Offer(MemberId);
};

let handleMessageFromPeer=async(message,MemberId)=>{
    message=JSON.parse(message.text)
    if(message.type === 'offer'){
        createAnswer(MemberId, message.offer)
    }

    if(message.type === 'answer'){
        addAnswer(message.answer)
    }

    if(message.type === 'candidate'){
        if(peerConnection){
            peerConnection.addIceCandidate(message.candidate)
        }
    }

    };

    let handleUserLeft=async(MemberId)=>{
        document.getElementById("user-2").style.display="none";
        document.getElementById('user-1').classList.remove('smallFrame');
  
    };
//The below createpeer connection is common for offer and answer offer is from us to the another peer
let createPeerConnection=async (MemberId)=>{
      peerConnection=new RTCPeerConnection(servers);

        client_stream=new MediaStream();//setting the video and media streams from client
        document.getElementById("user-2").srcObject=client_stream;

        document.getElementById("user-2").style.display="block";
        document.getElementById('user-1').classList.add('smallFrame');
        //we are looping through al the video and audio tracks and add them to peerconnecton so client peer can actually get them so well
        if(!my_stream)
        {
            my_stream= await navigator.mediaDevices.getUserMedia({video: true,audio:true});
            document.getElementById("user-1").srcObject=my_stream;
        }
        my_stream.getTracks().forEach((track)=>
        {
        peerConnection.addTrack(track,my_stream);
        });
        
        //by adding these tracks we are sending them to the client peer our tracks 
        
        // To collect the tracks from the other peer in a WebRTC communication, you typically use the ontrack event handler
        peerConnection.ontrack=(event)=>{
            //. The ontrack event is triggered each time a new track is added to the connection, but the associated event.streams array usually contains only one MediaStream object.
            event.streams[0].getTracks().forEach((track)=>{
               client_stream.addTrack(track);
            });
        }
        //Typically ice candidate provides the information about the ipaddress and port from where the data is going to be exchanged.
        //onicecandidate It enables WebRTC peers to discover the best communication path by gathering a list of candidate IP addresses and ports.
        peerConnection.onicecandidate=async(event)=>{
            if (event.candidate)
            {   
                client.sendMessageToPeer({text:JSON.stringify({'type':'candidate', 'candidate':event.candidate})}, MemberId)
        
            } 
        
        }
    };
let creating_Offer =async (MemberId)=>{

await createPeerConnection(MemberId);
//So whenever the local description is set it triggers the icecandidate to make requests to stun server and it will make the ice 
let offer =await peerConnection.createOffer();
await peerConnection.setLocalDescription(offer);//means that the SDP (Session Description Protocol) offer generated by the client (the peer initiating the connection) is being set as the local description for your side (the server or another peer)
 client.sendMessageToPeer({text:JSON.stringify({'type':'offer', 'offer':offer})}, MemberId)
}

let createAnswer=async(MemberId,offer)=>{
    await createPeerConnection(MemberId);
    // The offer usually contains information about the capabilities and settings of the offering peer.
    await peerConnection.setRemoteDescription(offer);
    let answer = await peerConnection.createAnswer();
    // This prepares the answer to be sent back to the offering peer.
    await peerConnection.setLocalDescription(answer);
    client.sendMessageToPeer({text:JSON.stringify({'type':'answer','answer':answer})} ,MemberId);
};

let addAnswer=async (answer)=>{
    if(!peerConnection.currentRemoteDescription){
        peerConnection.setRemoteDescription(answer)
    }
};

let leaveRoom=async ()=>{
  await room.leave();
  await client.logout();
};

let toggleCamera = async () => {
    let videoTrack = my_stream.getTracks().find(track => track.kind === 'video')
//kind property is a string indicating whether the track is an audio track or a video track.
    if(videoTrack.enabled){
        videoTrack.enabled = false
        document.getElementById('Camerabtn').style.backgroundColor = 'rgb(255, 80, 80)'
    }else{
        videoTrack.enabled = true
        document.getElementById('Camerabtn').style.backgroundColor = 'rgb(0, 204, 0,0.9)'
    }
}

let toggleMic = async () => {
    let audioTrack = my_stream.getTracks().find(track => track.kind === 'audio')

    if(audioTrack.enabled){
        audioTrack.enabled = false
        document.getElementById('micbtn').style.backgroundColor = 'rgb(255, 80, 80)'
    }else{
        audioTrack.enabled = true
        document.getElementById('micbtn').style.backgroundColor = 'rgb(0, 204, 0,0.9)'
    }
}




document.getElementById('Camerabtn').addEventListener('click',toggleCamera);
document.getElementById('micbtn').addEventListener('click',toggleMic);
window.addEventListener("beforeunload",leaveRoom);
opened();


// we need to send all the above to peer and connection happens i.e this proccess is called as Signalling 
//Instead of buliding a Signalling using the websockets we use a 3rd party Agora
//webrtc only know how to communicate but cannot get user details directly 
//Signalling is  a process of exchange of IPadd and session description and also passes the offer , answer, ice candidate