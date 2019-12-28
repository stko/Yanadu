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
	
	//On connection server sends the client his ID
	introduction(_id, _clientNum, _ids){
	
	  for(let i = 0; i < _ids.length; i++){
		if(_ids[i] != _id){
			this.clients[_ids[i]] = {
			mesh: new THREE.Mesh(
				new THREE.BoxGeometry(1,1,1),
				new THREE.MeshNormalMaterial()
			)
		}
	
		//Add initial users to the scene
		this.glScene.scene.add(this.clients[_ids[i]].mesh)
		}
	  }
	
	  console.log(this.clients)
	
	  this.id = _id
	  console.log('My ID is: ' + this.id)
	
	}
	
	newUserConnected(clientCount, _id, _ids){
		console.log(clientCount + ' clients connected')
		let alreadyHasUser = false;
		for(let i = 0; i < Object.keys(this.clients).length; i++){
			if(Object.keys(this.clients)[i] == _id){
				alreadyHasUser = true;
				break;
			}
		}
		if(_id != this.id && !alreadyHasUser){
		console.log('A new user connected with the id: ' + _id)
		this.clients[_id] = {
			mesh: new THREE.Mesh(
			new THREE.BoxGeometry(1,1,1),
			new THREE.MeshNormalMaterial()
			)
		}

		//Add initial users to the scene
		this.glScene.scene.add(this.clients[_id].mesh);
		}
	
	}
	
	userDisconnected(clientCount, _id, _ids){
		//Update the data from the server
		document.getElementById('numUsers').textContent = clientCount;

		if(_id != this.id){
		console.log('A user disconnected with the id: ' + _id)
		this.glScene.scene.remove(this.clients[_id].mesh)
		delete this.clients[_id]
		}
	}
	
	//Update when one of the users moves in space
	userPositions (_clientProps){
		console.log('Positions of all users are ', _clientProps, this.id)
		console.log(Object.keys(_clientProps)[0] == this.id)
		for(let i = 0; i < Object.keys(_clientProps).length; i++){
			if(Object.keys(_clientProps)[i] != this.id){

				//Store the values
				let oldPos = this.clients[Object.keys(_clientProps)[i]].mesh.position
				let newPos = _clientProps[Object.keys(_clientProps)[i]].position

				//Create a vector 3 and lerp the new values with the old values
				let lerpedPos = new THREE.Vector3()
				lerpedPos.x = THREE.Math.lerp(oldPos.x, newPos[0], 0.3)
				lerpedPos.y = THREE.Math.lerp(oldPos.y, newPos[1], 0.3)
				lerpedPos.z = THREE.Math.lerp(oldPos.z, newPos[2], 0.3)

				//Set the position
				this.clients[Object.keys(_clientProps)[i]].mesh.position.set(lerpedPos.x, lerpedPos.y, lerpedPos.z);
			}
		}
	}
}

export default Room;
