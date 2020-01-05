import Room from './room'
import WebRTC from './webRTC'
import WebService from './webService'


//One WebGL context to rule them all !
let webRTC = new WebRTC()
let webService = new WebService()
let room = new Room(userMoved)
function userMoved(coords){
	webService.emit('room_move', coords)
}
webRTC.init(webService) //announces the webRTC to the webservice
room.init(webService) //announces the webRTC to the webservice
webService.init() // let's rock

