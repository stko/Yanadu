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


		this.title = this.makeTextSprite( this.name, 
		{ fontsize: 24, borderColor: {r:255, g:0, b:0, a:1.0}, backgroundColor: {r:255, g:100, b:100, a:0.8} } );
	
		this.title.position.set(this.mesh.position.x,this.mesh.position.y + 0.3 ,this.mesh.position.z);


		//Add initial users to the scene
		this.glScene.scene.add(this.mesh);
		this.glScene.scene.add(this.title);
		}

		makeTextSprite( message, parameters )
		{
			if ( parameters === undefined ) parameters = {};
			
			var fontface = parameters.hasOwnProperty("fontface") ? 
				parameters["fontface"] : "Arial";
			
			var fontsize = parameters.hasOwnProperty("fontsize") ? 
				parameters["fontsize"] : 18;
			
			var borderThickness = parameters.hasOwnProperty("borderThickness") ? 
				parameters["borderThickness"] : 4;
			
			var borderColor = parameters.hasOwnProperty("borderColor") ?
				parameters["borderColor"] : { r:0, g:0, b:0, a:1.0 };
			
			var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
				parameters["backgroundColor"] : { r:255, g:255, b:255, a:1.0 };
		
			//var spriteAlignment = THREE.SpriteAlignment.topLeft;
				
			var canvas = document.createElement('canvas');
			var context = canvas.getContext('2d');
			context.font = "Bold " + fontsize + "px " + fontface;
			
			// get size data (height depends only on font size)
			var metrics = context.measureText( message );
			var textWidth = metrics.width;
			
			// background color
			context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + ","
										  + backgroundColor.b + "," + backgroundColor.a + ")";
			// border color
			context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
										  + borderColor.b + "," + borderColor.a + ")";
		
			context.lineWidth = borderThickness;
			this.roundRect(context, borderThickness/2, borderThickness/2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);
			// 1.4 is extra height factor for text below baseline: g,j,p,q.
			
			// text color
			context.fillStyle = "rgba(0, 0, 0, 1.0)";
		
			context.fillText( message, borderThickness, fontsize + borderThickness);
			
			// canvas contents will be used for a texture
			var texture = new THREE.Texture(canvas) 
			texture.needsUpdate = true;
		
			var spriteMaterial = new THREE.SpriteMaterial( 
				//{ map: texture, useScreenCoordinates: false, alignment: spriteAlignment } );
				{ map: texture, useScreenCoordinates: false } );
				var sprite = new THREE.Sprite( spriteMaterial );
			//sprite.scale.set(100,50,1.0);
			return sprite;	
		}
		
		// function for drawing rounded rectangles
		roundRect(ctx, x, y, w, h, r) 
		{
			ctx.beginPath();
			ctx.moveTo(x+r, y);
			ctx.lineTo(x+w-r, y);
			ctx.quadraticCurveTo(x+w, y, x+w, y+r);
			ctx.lineTo(x+w, y+h-r);
			ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
			ctx.lineTo(x+r, y+h);
			ctx.quadraticCurveTo(x, y+h, x, y+h-r);
			ctx.lineTo(x, y+r);
			ctx.quadraticCurveTo(x, y, x+r, y);
			ctx.closePath();
			ctx.fill();
			ctx.stroke();   
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
		this.title.position.set(lerpedPos.x, lerpedPos.y + 0.3 , lerpedPos.z )

		//Set the rotation
		//self.clients[Object.keys(coords)[i]].mesh.rotation.set(newRotation)
		//self.clients[Object.keys(coords)[i]].mesh.rotation.y += 0.01
		this.mesh.rotation.y = newRotation[1]


	}
}

export default Avatar;
