/* Abstraction layer to load a room and let some persons moving around in it*/

//import Scene from './scene';
import * as THREE from 'three';

class Avatar  {
	

	constructor(glScene,userData){
		this.glScene = glScene
		this.avatarID = userData.id
		this.name = userData.name
		this.mesh = new THREE.Mesh(
			new THREE.BoxGeometry(1,1,1),
			new THREE.MeshNormalMaterial()
			)

			var canvas1 = document.createElement('canvas');
			var context1 = canvas1.getContext('2d');
			context1.font = "Bold 40px Arial";
			context1.fillStyle = "rgba(255,0,0,0.95)";
			context1.fillText(this.name, 0, 50);
		
			var texture1 = new THREE.Texture(canvas1);
			texture1.needsUpdate = true;
		
			var material1 = new THREE.MeshBasicMaterial( { map: texture1, side:THREE.DoubleSide } );
			material1.transparent = true;
		
			this.title = new THREE.Mesh(
				new THREE.PlaneGeometry(canvas1.width, canvas1.height),
				material1
			);
		
			this.title.position.set(this.mesh.position.x,this.mesh.position.y ,this.mesh.position.z+2);

		//Add initial users to the scene
		this.glScene.scene.add(this.mesh);
		this.glScene.scene.add(this.title);
		}
		
		remove(){
			this.glScene.scene.remove(this.mesh)
			this.glScene.scene.remove(this.title)
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
		this.title.position.set(lerpedPos.x, lerpedPos.y , lerpedPos.z +2)

		//Set the rotation
		//self.clients[Object.keys(coords)[i]].mesh.rotation.set(newRotation)
		//self.clients[Object.keys(coords)[i]].mesh.rotation.y += 0.01
		this.mesh.rotation.y = newRotation[1]


	}
}

export default Avatar;
