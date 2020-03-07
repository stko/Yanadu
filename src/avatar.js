/* Abstraction layer to load a room and let some persons moving around in it*/

//import Scene from './scene';
import * as THREE from 'three';

class Avatar  {
	

	constructor(glScene,avatarID){
		this.glScene = glScene
		this.avatarID = avatarID
		this.mesh = new THREE.Mesh(
			new THREE.BoxGeometry(1,1,1),
			new THREE.MeshNormalMaterial()
			)
		//Add initial users to the scene
		this.glScene.scene.add(this.mesh);
		}
		
		remove(){
			this.glScene.scene.remove(this.mesh)
		}
		
	setPosition(coords){
		let oldPos = this.mesh.position
		console.log("coords:",coords)
		let newPos = coords.position
		let newRotation = coords.rotation

		//Create a vector 3 and lerp the new values with the old values
		let lerpedPos = new THREE.Vector3()
		lerpedPos.x = THREE.Math.lerp(oldPos.x, newPos[0], 0.3)
		lerpedPos.y = THREE.Math.lerp(oldPos.y, newPos[1], 0.3)
		lerpedPos.z = THREE.Math.lerp(oldPos.z, newPos[2], 0.3)

		//Set the position
		this.mesh.position.set(lerpedPos.x, lerpedPos.y, lerpedPos.z)
		//Set the rotation
		//self.clients[Object.keys(coords)[i]].mesh.rotation.set(newRotation)
		//self.clients[Object.keys(coords)[i]].mesh.rotation.y += 0.01
		this.mesh.rotation.y = newRotation[1]


	}
}

export default Avatar;
