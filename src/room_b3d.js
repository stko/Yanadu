/* Abstraction layer to load a room and let some persons moving around in it*/

//import Scene from './scene';
import * as THREE from 'three';


class Room_B3D {

	constructor(room_url, glScene) {
		// https://stackoverflow.com/q/15246598
		var _this = this
		this.loader = new THREE.JSONLoader();
		fetch(room_url)
			.then(res => res.json())
			.then((roomLayoutJson) => {
				console.log('Checkout this JSON! ', roomLayoutJson);
				roomLayoutJson.items.forEach(item => {
					console.log(item);
					var this_mesh;
					if (item.model_url) {
						var res = item.model_url.split("/");
						var itemJs = "/rooms/models/" + res[res.length - 1]
						console.log(itemJs)


						this.loader.onLoadComplete=function(){
							//glScene.scene.add(this_mesh)
							console.log("Load complete")
						} 
						this.loader.load(itemJs,
							function (geometry, materials) {
								var material = materials[0]
								geometry.computeBoundingBox()
								geometry.applyMatrix(new THREE.Matrix4().makeTranslation(-0.5 * (geometry.boundingBox.max.x + geometry.boundingBox.min.x), -0.5 * (geometry.boundingBox.max.y + geometry.boundingBox.min.y), -0.5 * (geometry.boundingBox.max.z + geometry.boundingBox.min.z)))
								geometry.computeBoundingBox()
								//var mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));
								//this_mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial(materials[0]));
								this_mesh = new THREE.Mesh(geometry, new THREE.MeshNormalMaterial());
								this_mesh.position.set(
									item.xpos / 100,
									item.ypos / 100,
									item.zpos / 100
								)
								this_mesh.scale.set(
									item.scale_x / 100,
									item.scale_y / 100,
									item.scale_z / 100
								);
								this_mesh.rotation.y = item.rotation
								this_mesh.name = item.item_name
								this_mesh.receiveShadow = true
								this_mesh.castShadow = true
								glScene.scene.add(this_mesh)
							}
						);
					}
				});
			})
			.catch(err => { throw err });
		console.log("scene:", glScene.scene)
	}
}

export default Room_B3D;
