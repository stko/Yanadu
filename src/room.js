/* Abstraction layer to load a room and let some persons moving around in it*/

import Scene from './scene';
import * as THREE from 'three';

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
			this.emit_room_move(this.glScene.camera)
		});
		this.glScene.on('mouseMoved', ()=>{
			this.emit_room_move(this.glScene.camera)
		});
		}
		
		poll_movements(self){
			if (self.glScene && self.glScene.camera && self.emit){
				self.emit_room_move(self, self.glScene.camera);
			}
			self.intervalID = window.setTimeout(function(){self.poll_movements(self);}, 100);
		}

		emit_room_move(self, camera){
			if (camera){
				let vector = camera.getWorldDirection();
				let theta = Math.atan2(vector.x,vector.z);
				let newPosX = Math.floor(camera.position.x * 4);
				let newPosY = Math.floor(camera.position.y * 4);
				let newAngle = Math.floor(theta * 8 / Math.PI); 
				if (newPosX != self.lastPosX || newPosY != self.lastPosY || newAngle != self.lastAngle){
					self.lastPosX = newPosX;
					self.lastPosY = newPosY;
					self.lastAngle = newAngle;
					self.emit("room_move",{'pos':[camera.position.x, camera.position.y, camera.position.z],"angle":theta})
				}
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
				console.log("coords:",coords)
				let newPos = coords[Object.keys(coords)[i]].position
				let newRotation = coords[Object.keys(coords)[i]].rotation

				//Create a vector 3 and lerp the new values with the old values
				let lerpedPos = new THREE.Vector3()
				lerpedPos.x = THREE.Math.lerp(oldPos.x, newPos[0], 0.3)
				lerpedPos.y = THREE.Math.lerp(oldPos.y, newPos[1], 0.3)
				lerpedPos.z = THREE.Math.lerp(oldPos.z, newPos[2], 0.3)

				//Set the position
				self.clients[Object.keys(coords)[i]].mesh.position.set(lerpedPos.x, lerpedPos.y, lerpedPos.z)
				//Set the rotation
				//self.clients[Object.keys(coords)[i]].mesh.rotation.set(newRotation)
				//self.clients[Object.keys(coords)[i]].mesh.rotation.y += 0.01
				self.clients[Object.keys(coords)[i]].mesh.rotation.y = newRotation[1]
	
			}
		}
	}
}

export default Room;
