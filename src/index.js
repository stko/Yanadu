import Room from './room'
import WebRTC from './webRTC'

//A socket.io instance
const socket = io()

//One WebGL context to rule them all !
let webRTC = new WebRTC()
let room = new Room(userMoved)
function userMoved(coords){
	console.log("index: move")
	socket.emit('move', coords)
}


//On connection server sends the client his ID
socket.on('introduction', (_id, _clientNum, _ids)=>{
	room.introduction(_id, _clientNum, _ids)
});

socket.on('newUserConnected', (clientCount, _id, _ids)=>{
	room.newUserConnected(clientCount, _id, _ids)
});

socket.on('userDisconnected', (clientCount, _id, _ids)=>{
	room.userDisconnected(clientCount, _id, _ids)
});

socket.on('connect', ()=>{})

//Update when one of the users moves in space
socket.on('userPositions', _clientProps =>{
	room.userPositions(_clientProps)
})
