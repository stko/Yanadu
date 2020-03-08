/* Abstraction layer to load a room and let some persons moving around in it*/

import Scene from './scene';
import * as THREE from 'three';
import Avatar from './avatar';
import Room_B3D from './room_b3d';

class Room  {
	

	constructor(emit){
		this.glScene = new Scene()
		this.id = 0
		this.emit=emit
		this.lastPosX=0
		this.lastPosY=0
		this.lastAngle=0
		this.instances = []
		this.clients = new Object()
		self=this
		this.glScene.on('userMoved', ()=>{
			this.emit_room_move(self)
		});
		this.glScene.on('mouseMoved', ()=>{
			this.emit_room_move(self)
		});
		}
		
		poll_movements(self){
			if (self.glScene  && self.emit){
				self.emit_room_move(self );
			}
			self.intervalID = window.setTimeout(function(){self.poll_movements(self);}, 100);
		}

		emit_room_move(self){
			let pos=self.glScene.detectMove(self.lastPosX,self.lastPosY,self.lastAngle)
			
			if (pos!=null){
				self.lastPosX = pos[0];
				self.lastPosY = pos[1];
				self.lastAngle = pos[3];
				self.emit("room_move",{'pos':[pos[0], pos[1], pos[2]],"angle":pos[3]})
			}
		}
		
		init (webSocket) {
			// try to solve the "self" problem with ()=>{}
			webSocket.register("room_", (data)=>{this.handleWSMsg(this,data)},this.onWebSocketOpen,this.onWebSocketClose)
			this.emit=webSocket.emit
			this.intervalID =  window.setTimeout(()=>{this.poll_movements(this);}, 100);
		}
	
		handleWSMsg (self, data) {
			switch (data.type) {
				//On connection server sends the client his ID
				case "room_introduction":
					self.do_introduction(self,data.config)
					break;
				case "room_newUserConnected":
					self.do_newUserConnected(self,data.config)
					break;
				case "room_userDisconnected":
					self.do_userDisconnected(self,data.config)
					break;
				case "room_userPositions":
					self.do_userPositions(self,data.config)
					break;
				default:
					break;
			}
		}

		onWebSocketOpen () {
		}
	
		onWebSocketClose () {

		}
	
	
	//On connection server sends the client the user data
	do_introduction(self,config){
		console.log("do_introduction",config)
		for(let i = 0; i < config._ids.length; i++){
			if(config._ids[i].peer_id != config.id || true){
				self.clients[config._ids[i].peer_id] = {
					avatar: new Avatar(self.glScene,config._ids[i])
				}
			}
		}
		self.id = config.id
		this.loadRoom(config.room_url)
	}

	loadRoom(room_url){
		console.log("try to load ",room_url)
		var room_b3d=new Room_B3D(room_url,this.glScene)
	}
	
	do_newUserConnected(self, config){
		console.log(config._clientNum + ' clients connected')
		let alreadyHasUser = false;
		for(let i = 0; i < Object.keys(self.clients).length; i++){
			if(Object.keys(self.clients)[i] == config.id){
				alreadyHasUser = true;
				break;
			}
		}
		if(config.id != self.id && !alreadyHasUser){
			console.log('A new user connected with the id: ' + config.id)
			self.clients[config.id] = 
			{
				avatar: new Avatar(self.glScene,config.id)
			}
		}
	}
	
	do_userDisconnected(self, config){
		//Update the data from the server
		document.getElementById('numUsers').textContent = config.clientCount;

		if(config.id != self.id){
		console.log('A user disconnected with the id: ' + config.id)
		self.clients[config.id].avatar.remove()
		delete self.clients[config.id]
		}
	}
	
	//Update when one of the users moves in space
	do_userPositions (self, config){
		let coords=config.coords
		for(let i = 0; i < Object.keys(coords).length; i++){
			if(Object.keys(coords)[i] != self.id || true){
				//Store the values
				console.log("coords:",coords)
				console.log("self.clients:",self.clients)
				self.clients[Object.keys(coords)[i]].avatar.setPosition(coords[Object.keys(coords)[i]])

			}
		}
	}
}

export default Room;
