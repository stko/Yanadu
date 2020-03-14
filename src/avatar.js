/* Abstraction layer to load a room and let some persons moving around in it*/

//import Scene from './scene';
import * as THREE from 'three';
import GLTFLoader from 'three-gltf-loader';

//import * as GLTFLoader from 'three/examples/jsm/loaders/GLTFLoader';



class Avatar  {
	

	constructor(glScene,userData){
		this.glScene = glScene
		this.avatarID = userData.id
		this.name = userData.name
		this.api = { state: 'Walking' };
		var self=this

		// https://github.com/mrdoob/three.js/blob/master/examples/webgl_animation_skinning_morph.html

		/*
		this.mesh = new THREE.Mesh(
			new THREE.BoxGeometry(1,1,1),
			new THREE.MeshNormalMaterial()
			)
		this.mesh.position.set(0, + 0.5 ,0);
		//Add initial users to the scene
		this.glScene.scene.add(this.mesh);
		*/
		this.title = this.makeTextSprite( this.name, 
		{ fontsize: 24, borderColor: {r:255, g:0, b:0, a:1.0}, backgroundColor: {r:255, g:100, b:100, a:0.8} } );
	



		// *
		var loader = new GLTFLoader();
		loader.load( '/avatars/RobotExpressive.glb', function ( gltf ) {

			self.model = gltf.scene;
			self.glScene.scene.add( self.model );

			createGUI( self.model, gltf.animations );

		}, undefined, function ( e ) {

			console.error( e );

		} );


		function createGUI( model, animations ) {

			var states = [ 'Idle', 'Walking', 'Running', 'Dance', 'Death', 'Sitting', 'Standing' ];
			var emotes = [ 'Jump', 'Yes', 'No', 'Wave', 'Punch', 'ThumbsUp' ];

			//this.gui = new GUI();

			self.mixer = new THREE.AnimationMixer( model );

			var actions = {};

			for ( var i = 0; i < animations.length; i ++ ) {

				var clip = animations[ i ];
				var action = self.mixer.clipAction( clip );
				actions[ clip.name ] = action;

				if ( emotes.indexOf( clip.name ) >= 0 || states.indexOf( clip.name ) >= 4 ) {

					action.clampWhenFinished = true;
					action.loop = THREE.LoopOnce;

				}

			}

			/* GUI
			// states

			var statesFolder = gui.addFolder( 'States' );

			var clipCtrl = statesFolder.add( api, 'state' ).options( states );

			clipCtrl.onChange( function () {

				fadeToAction( this.api.state, 0.5 );

			} );

			statesFolder.open();

			// emotes

			var emoteFolder = gui.addFolder( 'Emotes' );

			function createEmoteCallback( name ) {

				this.api[ name ] = function () {

					fadeToAction( name, 0.2 );

					mixer.addEventListener( 'finished', restoreState );

				};

				emoteFolder.add( this.api, name );

			}

			function restoreState() {

				mixer.removeEventListener( 'finished', restoreState );

				fadeToAction( this.api.state, 0.2 );

			}

			for ( var i = 0; i < emotes.length; i ++ ) {

				createEmoteCallback( emotes[ i ] );

			}

			emoteFolder.open();

			// expressions

			face = model.getObjectByName( 'Head_2' );

			var expressions = Object.keys( face.morphTargetDictionary );
			var expressionFolder = gui.addFolder( 'Expressions' );

			for ( var i = 0; i < expressions.length; i ++ ) {

				expressionFolder.add( face.morphTargetInfluences, i, 0, 1, 0.01 ).name( expressions[ i ] );

			}
*/
			var activeAction = actions[ 'Walking' ];
			activeAction.play();

//			expressionFolder.open();

		}


// */

		//this.title.position.set(self.model.position.x,self.model.position.y + 0.3 ,self.mesh.position.z);

		this.glScene.scene.add(this.title);
		}

		
	fadeToAction( name, duration ) {

		previousAction = activeAction;
		activeAction = actions[ name ];

		if ( previousAction !== activeAction ) {

			previousAction.fadeOut( duration );

		}

		activeAction
			.reset()
			.setEffectiveTimeScale( 1 )
			.setEffectiveWeight( 1 )
			.fadeIn( duration )
			.play();

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
		this.glScene.scene.remove(this.model)
		this.glScene.scene.remove(this.title)
	}
		
	setPosition(coords){
		let oldPos = this.model.position
		console.log("coords:",coords)
		let newPos = coords.position
		let newRotation = coords.rotation

		//Create a vector 3 and lerp the new values with the old values
		let lerpedPos = new THREE.Vector3()
		lerpedPos.x = THREE.Math.lerp(oldPos.x, newPos[0], 0.3)
		lerpedPos.y = THREE.Math.lerp(oldPos.y, newPos[1], 0.3)
		lerpedPos.z = THREE.Math.lerp(oldPos.z, newPos[2], 0.3)

		//Set the position
		this.model.position.set(lerpedPos.x, lerpedPos.y, lerpedPos.z)
		this.title.position.set(lerpedPos.x, lerpedPos.y + 0.3 , lerpedPos.z )

		//Set the rotation
		//self.clients[Object.keys(coords)[i]].mesh.rotation.set(newRotation)
		//self.clients[Object.keys(coords)[i]].mesh.rotation.y += 0.01
		this.model.rotation.y = newRotation[1]


	}
}

export default Avatar;
