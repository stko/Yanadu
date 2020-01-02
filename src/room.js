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
	
		this.glScene.on('userMoved', ()=>{
			console.log("room: move")
		  this.emit([this.glScene.camera.position.x, this.glScene.camera.position.y, this.glScene.camera.position.z]);
		});
		this.glScene.on('mouseMoved', ()=>{
			console.log("mouse: move")
		  this.emit([this.glScene.camera.position.x, this.glScene.camera.position.y, this.glScene.camera.position.z]);
		});
		}
		
		
		init (webSocket) {
			console.log("init room")
			webSocket.register("room_", this.handleWSMsg,this.onWebSocketOpen,this.onWebSocketClose)
			this.emit=webSocket.emit
		}
	
		handleWSMsg (data) {
			switch (data.type) {
				//On connection server sends the client his ID
				case "room_introduction":
					this.do_introduction(data.config)
					break;
				case "room_newUserConnected":
					this.do_newUserConnected(data.config)
					break;
				case "room_userDisconnected":
					this.do_userDisconnected(data.config)
					break;
				case "room_userPositions":
					this.do_userPositions(data.config)
					break;
				default:
					break;
			}
		}

		onWebSocketOpen () {
			console.log("onWebSocketOpen in room")
		}
	
		onWebSocketClose () {
			console.log("onWebSocketClose in room")
		}
	
	
	//On connection server sends the client his ID
	do_introduction(config){
	  for(let i = 0; i < config._ids.length; i++){
		if(config._ids[i] != config._id){
			this.clients[config._ids[i]] = {
			mesh: new THREE.Mesh(
				new THREE.BoxGeometry(1,1,1),
				new THREE.MeshNormalMaterial()
			)
		}
		//Add initial users to the scene
		this.glScene.scene.add(this.clients[config._ids[i]].mesh)
		}
	  }
	
	  console.log(this.clients)
	
	  this.id = config._id
	  console.log('My ID is: ' + this.id)
	
	}
	
	do_newUserConnected(config){
		console.log(config.clientCount + ' clients connected')
		let alreadyHasUser = false;
		for(let i = 0; i < Object.keys(this.clients).length; i++){
			if(Object.keys(this.clients)[i] == config._id){
				alreadyHasUser = true;
				break;
			}
		}
		if(config._id != this.id && !alreadyHasUser){
		console.log('A new user connected with the id: ' + config._id)
		this.clients[config._id] = {
			mesh: new THREE.Mesh(
			new THREE.BoxGeometry(1,1,1),
			new THREE.MeshNormalMaterial()
			)
		}

		//Add initial users to the scene
		this.glScene.scene.add(this.clients[config._id].mesh);
		}
	
	}
	
	do_userDisconnected(config){
		//Update the data from the server
		document.getElementById('numUsers').textContent = config.clientCount;

		if(config._id != this.id){
		console.log('A user disconnected with the id: ' + config._id)
		this.glScene.scene.remove(this.clients[config._id].mesh)
		delete this.clients[config._id]
		}
	}
	
	//Update when one of the users moves in space
	do_userPositions (config){
		console.log('Positions of all users are ', config._clientProps, this.id)
		console.log(Object.keys(config._clientProps)[0] == this.id)
		for(let i = 0; i < Object.keys(config._clientProps).length; i++){
			if(Object.keys(config._clientProps)[i] != this.id){

				//Store the values
				let oldPos = this.clients[Object.keys(config._clientProps)[i]].mesh.position
				let newPos = config._clientProps[Object.keys(config._clientProps)[i]].position

				//Create a vector 3 and lerp the new values with the old values
				let lerpedPos = new THREE.Vector3()
				lerpedPos.x = THREE.Math.lerp(oldPos.x, newPos[0], 0.3)
				lerpedPos.y = THREE.Math.lerp(oldPos.y, newPos[1], 0.3)
				lerpedPos.z = THREE.Math.lerp(oldPos.z, newPos[2], 0.3)

				//Set the position
				this.clients[Object.keys(config._clientProps)[i]].mesh.position.set(lerpedPos.x, lerpedPos.y, lerpedPos.z);
			}
		}
	}
}

export default Room;
