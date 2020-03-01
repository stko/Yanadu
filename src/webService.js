/**
 * Class to manage the websocket communications
 */


class WebService {

	constructor(){
		let ws_protocol="ws://"
		if (window.location.protocol=="https:"){
			ws_protocol="wss://"
		}
		this.SIGNALING_SERVER = ws_protocol + window.location.hostname + ":" + window.location.port
		this.signaling_socket =  null   /* our socket.io connection to our webserver */
		this.modules = {} /* contains the registered modules */
		//alias for sending JSON encoded messages
		this.emit = (type, config) => {
			//attach the other peer username to our messages 
			let message = { 'type': type, 'config': config }
			if (this.signaling_socket.readyState==1){
			this.signaling_socket.send(JSON.stringify(message))
			}
		}
		console.log("Construct WebService", this.modules)

	}

	register(prefix,wsMsghandler,wsOnOpen,wsOnClose){
		this.modules[prefix]={'msg':wsMsghandler,'open':wsOnOpen,'close':wsOnOpen}
		console.log("Register prefix", prefix,this.modules)
	}

	init () {
		console.log("Connecting to signaling server")
		this.signaling_socket = new WebSocket(this.SIGNALING_SERVER)
		this.signaling_socket.onopen =  ()  => {
			console.log("Connected to the signaling server")
			for (let prefix in this.modules){
				this.modules[prefix].open()
			}
		}

		this.signaling_socket.onclose =  (event)=>  {
			console.log("Disconnected from signaling server")
			for (let prefix in this.modules){
				this.modules[prefix].close()
			}
		}

		//when we got a message from a signaling server 
		this.signaling_socket.onmessage =  (msg) => {
			var data = JSON.parse(msg.data)
			var success=false
			for (let prefix in this.modules){
				if (data.type.startsWith(prefix)){
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

}


export default WebService