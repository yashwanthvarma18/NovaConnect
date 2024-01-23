const APP_ID="186e136919354266ae03b47678d021c1";let token=null;let uid=String(Math.floor(Math.random()*10000));let queryString=window.location.search
let urlParams=new URLSearchParams(queryString)
let roomId=urlParams.get('room')
if(!roomId){window.location='DashBoard.html'}
let client;let room;let my_stream;let client_stream;let peerConnection;const servers={iceServers:[{urls:['stun:stun1.l.google.com:19302','stun:stun2.l.google.com:19302']}]}
let Configs={video:{width:{min:640,ideal:1920,max:1920},height:{min:480,ideal:1080,max:1080},},audio:!0}
let opened=async()=>{client=await AgoraRTM.createInstance(APP_ID);await client.login({uid,token});room=client.createChannel(roomId)
await room.join();room.on('MemberJoined',handleUserJoined);room.on('MemberLeft',handleUserLeft);client.on('MessageFromPeer',handleMessageFromPeer);my_stream=await navigator.mediaDevices.getUserMedia(Configs);document.getElementById("user-1").srcObject=my_stream}
let handleUserJoined=async(MemberId)=>{console.log("New user joined",MemberId);creating_Offer(MemberId)};let handleMessageFromPeer=async(message,MemberId)=>{message=JSON.parse(message.text)
if(message.type==='offer'){createAnswer(MemberId,message.offer)}
if(message.type==='answer'){addAnswer(message.answer)}
if(message.type==='candidate'){if(peerConnection){peerConnection.addIceCandidate(message.candidate)}}};let handleUserLeft=async(MemberId)=>{document.getElementById("user-2").style.display="none";document.getElementById('user-1').classList.remove('smallFrame')};let createPeerConnection=async(MemberId)=>{peerConnection=new RTCPeerConnection(servers);client_stream=new MediaStream();document.getElementById("user-2").srcObject=client_stream;document.getElementById("user-2").style.display="block";document.getElementById('user-1').classList.add('smallFrame');if(!my_stream){my_stream=await navigator.mediaDevices.getUserMedia({video:!0,audio:!0});document.getElementById("user-1").srcObject=my_stream}
my_stream.getTracks().forEach((track)=>{peerConnection.addTrack(track,my_stream)});peerConnection.ontrack=(event)=>{event.streams[0].getTracks().forEach((track)=>{client_stream.addTrack(track)})}
peerConnection.onicecandidate=async(event)=>{if(event.candidate){client.sendMessageToPeer({text:JSON.stringify({'type':'candidate','candidate':event.candidate})},MemberId)}}};let creating_Offer=async(MemberId)=>{await createPeerConnection(MemberId);let offer=await peerConnection.createOffer();await peerConnection.setLocalDescription(offer);client.sendMessageToPeer({text:JSON.stringify({'type':'offer','offer':offer})},MemberId)}
let createAnswer=async(MemberId,offer)=>{await createPeerConnection(MemberId);await peerConnection.setRemoteDescription(offer);let answer=await peerConnection.createAnswer();await peerConnection.setLocalDescription(answer);client.sendMessageToPeer({text:JSON.stringify({'type':'answer','answer':answer})},MemberId)};let addAnswer=async(answer)=>{if(!peerConnection.currentRemoteDescription){peerConnection.setRemoteDescription(answer)}};let leaveRoom=async()=>{await room.leave();await client.logout()};let toggleCamera=async()=>{let videoTrack=my_stream.getTracks().find(track=>track.kind==='video')
if(videoTrack.enabled){videoTrack.enabled=!1
document.getElementById('Camerabtn').style.backgroundColor='rgb(255, 80, 80)'}else{videoTrack.enabled=!0
document.getElementById('Camerabtn').style.backgroundColor='rgb(0, 204, 0,0.9)'}}
let toggleMic=async()=>{let audioTrack=my_stream.getTracks().find(track=>track.kind==='audio')
if(audioTrack.enabled){audioTrack.enabled=!1
document.getElementById('micbtn').style.backgroundColor='rgb(255, 80, 80)'}else{audioTrack.enabled=!0
document.getElementById('micbtn').style.backgroundColor='rgb(0, 204, 0,0.9)'}}
document.getElementById('Camerabtn').addEventListener('click',toggleCamera);document.getElementById('micbtn').addEventListener('click',toggleMic);window.addEventListener("beforeunload",leaveRoom);opened()