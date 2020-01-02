import Room from './room'
import WebRTC from './webRTC'
import WebService from './webService'

//A socket.io instance
const socket = io()

//One WebGL context to rule them all !
let webRTC = new WebRTC()
let webService = new WebService()
let room = new Room(userMoved)
function userMoved(coords){
	console.log("index: move")
	socket.emit('move', coords)
}
webRTC.init(webService) //announces the webRTC to the webservice
webService.init() // let's rock



//On connection server sends the client his ID
socket.on('introduction', (_id, _clientNum, _ids)=>{
	room.handleWSMsg({'type':'room_introduction', 'config':{'id':_id, '_clientNum':_clientNum, '_ids': _ids}})
});

socket.on('newUserConnected', (clientCount, _id, _ids)=>{
	room.handleWSMsg({'type':'room_newUserConnected', 'config':{'clientCount': clientCount, '_id':_id, '_ids':_ids}})
});

socket.on('userDisconnected', (clientCount, _id, _ids)=>{
	room.handleWSMsg({'type':'room_userDisconnected', 'config':{'clientCount': clientCount, '_id':_id, '_ids':_ids}})
});

socket.on('connect', ()=>{})

//Update when one of the users moves in space
socket.on('userPositions', _clientProps =>{
	room.handleWSMsg({'type':'room_userPositions', 'config':{'_clientProps':_clientProps}})
})
