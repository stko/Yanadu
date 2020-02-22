/* Abstraction layer to load a room and let some persons moving around in it*/

import Scene from './scene';
import * as THREE from 'three';

class Room  {
	

	constructor(emit){
		this.glScene = new Scene()
		this.id = 0
		this.emit=emit
		this.instances = []
		this.clients = new Object()
		self=this
		this.glScene.on('userMoved', ()=>{
			this.emit("room_move",{'pos':[this.glScene.camera.position.x, this.glScene.camera.position.y, this.glScene.camera.position.z]})
		});
		this.glScene.on('mouseMoved', ()=>{
			this.emit("room_move",{'pos':[this.glScene.camera.position.x, this.glScene.camera.position.y, this.glScene.camera.position.z]})
		});
		}
		
		
		init (webSocket) {
			// try to solve the "self" problem with ()=>{}
			webSocket.register("room_", (data)=>{this.handleWSMsg(this,data)},this.onWebSocketOpen,this.onWebSocketClose)
			this.emit=webSocket.emit
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
	
	
	//On connection server sends the client his ID
	do_introduction(self,config){
		console.log("do_introduction",config)
		for(let i = 0; i < config._ids.length; i++){
			if(config._ids[i] != config.id || true){
				self.clients[config._ids[i]] = {
				mesh: new THREE.Mesh(
					new THREE.BoxGeometry(1,1,1),
					new THREE.MeshNormalMaterial()
				)
			}
			//Add initial users to the scene
			self.glScene.scene.add(self.clients[config._ids[i]].mesh)
			}
		}
		self.id = config.id
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
		self.clients[config.id] = {
			mesh: new THREE.Mesh(
			new THREE.BoxGeometry(1,1,1),
			new THREE.MeshNormalMaterial()
			)
		}

		//Add initial users to the scene
		self.glScene.scene.add(self.clients[config.id].mesh);
		}
	
	}
	
	do_userDisconnected(self, config){
		//Update the data from the server
		document.getElementById('numUsers').textContent = config.clientCount;

		if(config.id != self.id){
		console.log('A user disconnected with the id: ' + config.id)
		self.glScene.scene.remove(self.clients[config.id].mesh)
		delete self.clients[config.id]
		}
	}
	
	//Update when one of the users moves in space
	do_userPositions (self, config){
		let coords=config.coords
		for(let i = 0; i < Object.keys(coords).length; i++){
			if(Object.keys(coords)[i] != self.id || true){
				//Store the values
				let oldPos = self.clients[Object.keys(coords)[i]].mesh.position
				let newPos = coords[Object.keys(coords)[i]]

				//Create a vector 3 and lerp the new values with the old values
				let lerpedPos = new THREE.Vector3()
				lerpedPos.x = THREE.Math.lerp(oldPos.x, newPos[0], 0.3)
				lerpedPos.y = THREE.Math.lerp(oldPos.y, newPos[1], 0.3)
				lerpedPos.z = THREE.Math.lerp(oldPos.z, newPos[2], 0.3)

				//Set the position
				self.clients[Object.keys(coords)[i]].mesh.position.set(lerpedPos.x, lerpedPos.y, lerpedPos.z);
			}
		}
	}
}

export default Room;
