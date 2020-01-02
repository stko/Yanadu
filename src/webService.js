/**
 * Class to manage the websocket communications
 */


class WebService {

	constructor(){
		this.SIGNALING_SERVER = "wss://" + window.location.hostname + ":" + window.location.port
		this.signaling_socket =  null   /* our socket.io connection to our webserver */
		this.modules = {} /* contains the registered modules */
	}

	register(prefix,wsMsghandler,wsOnOpen,wsOnClose){
		this.modules[prefix]={'msg':wsMsghandler,'open':wsOnOpen,'close':wsOnOpen}
	}

	init () {
		console.log("Connecting to signaling server")
		this.signaling_socket = new WebSocket(this.SIGNALING_SERVER)
		this.signaling_socket.onopen = function () {
			console.log("Connected to the signaling server")
			for (prefix in this.modules){
				this.modules[prefix].open()
			}
		}

		this.signaling_socket.onclose = function (event) {
			console.log("Disconnected from signaling server")
			for (prefix in this.modules){
				this.modules[prefix].close()
			}
		}

		//when we got a message from a signaling server 
		this.signaling_socket.onmessage = function (msg) {
			console.log("Got message", msg.data)
			var data = JSON.parse(msg.data)
			var success=false
			for (prefix in this.modules){
				if (data.type.startsWith(prefix)){
					console.log("found module for msg type",data.type)
					this.modules[prefix].msg(data)
					success=true
					break
				}
			}
			if (!success){
				console.log("Error: Unknown ws message type ", data.type)
			}
		}

		this.signaling_socket.onerror = function (err) {
			console.log("Got error", err)
		}
	}

	//alias for sending JSON encoded messages 
	emit (type, config) {
		//attach the other peer username to our messages 
		message = { 'type': type, 'config': config }
		this.signaling_socket.send(JSON.stringify(message))
	}
}


export default WebService