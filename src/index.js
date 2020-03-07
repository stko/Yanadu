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
//webService.init() // let's rock
window.showLogin = function (){
	// taken from https://www.w3schools.com/howto/howto_css_login_form.asp
	document.getElementById('login').style.display='block'
}

window.handleLogin = function (username, pw, remember){
	document.getElementById('login').style.display='none'
	alert(username)
	webService.init(username, pw, remember) // let's rock
}
showLogin()