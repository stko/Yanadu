import Scene from './scene';
import * as THREE from 'three';

var lifeSocket;
var socketHost = "209.177.93.71";
socketHost = "ws://" + socketHost + ":8080";

lifeSocket = new WebSocket(socketHost);

//A socket.io instance
/*--*/ const socket = io();

//One WebGL context to rule them all !
let glScene = new Scene();
let id;
let instances = [];
let clients = new Object();

glScene.on('userMoved', ()=>{
  /*--*/ socket.emit('move', [glScene.camera.position.x, glScene.camera.position.y, glScene.camera.position.z]);
});

lifeSocket.onopen = function (event) {
  lifeSocket.send(JSON.stringify({message:"init"}));
  lifeSocket.send(JSON.stringify({message:"scan rocks"}));
};

lifeSocket.onmessage = function(event) {
  var data  = JSON.parse(event.data);
  if ( data.message == "introduction" ) {



//On connection server sends the client his ID
//*--* socket.on('introduction', (_id, _clientNum, _ids)=>{

  for(let i = 0; i < data.data._ids.length; i++){
    if(data.data._ids[i] != data.data._id){
      clients[data.data._ids[i]] = {
        mesh: new THREE.Mesh(
          new THREE.BoxGeometry(1,1,1),
          new THREE.MeshNormalMaterial()
        )
      }

      //Add initial users to the scene
      glScene.scene.add(clients[data.data._ids[i]].mesh);
    }
  }

  console.log(clients);

  id = data.data._id;
  console.log('My ID is: ' + id);

//});
  }

  if ( data.message == "introduction" ) {

//*--*/ socket.on('newUserConnected', (clientCount, _id, _ids)=>{
  console.log(data.data.clientCount + ' clients connected');
  let alreadyHasUser = false;
  for(let i = 0; i < Object.keys(clients).length; i++){
    if(Object.keys(clients)[i] == data.data._id){
      alreadyHasUser = true;
      break;
    }
  }
  if(data.data._id != id && !alreadyHasUser){
    console.log('A new user connected with the id: ' + data.data._id);
    clients[data.data._id] = {
      mesh: new THREE.Mesh(
        new THREE.BoxGeometry(1,1,1),
        new THREE.MeshNormalMaterial()
      )
    }

    //Add initial users to the scene
    glScene.scene.add(clients[data.data._id].mesh);
  }

//});
  }
  if ( data.message == "userDisconnected" ) {

//*--*/ socket.on('userDisconnected', (clientCount, _id, _ids)=>{
  //Update the data from the server
  document.getElementById('numUsers').textContent = data.data.clientCount;

  if(data.data._id != id){
    console.log('A user disconnected with the id: ' + data.data._id);
    glScene.scene.remove(clients[data.data._id].mesh);
    delete clients[data.data._id];
  }
//});
  }

  if ( data.message == "connect" ) {
  }

/*--*/ socket.on('connect', ()=>{});

if ( data.message == "userPositions" ) {

//Update when one of the users moves in space
//*-- socket.on('userPositions', _clientProps =>{
  console.log('Positions of all users are ', data.data._clientProps, id);
  console.log(Object.keys(data.data._clientProps)[0] == id);
  for(let i = 0; i < Object.keys(data.data._clientProps).length; i++){
    if(Object.keys(data.data._clientProps)[i] != id){

      //Store the values
      let oldPos = clients[Object.keys(data.data._clientProps)[i]].mesh.position;
      let newPos = data.data._clientProps[Object.keys(data.data._clientProps)[i]].position;

      //Create a vector 3 and lerp the new values with the old values
      let lerpedPos = new THREE.Vector3();
      lerpedPos.x = THREE.Math.lerp(oldPos.x, newPos[0], 0.3);
      lerpedPos.y = THREE.Math.lerp(oldPos.y, newPos[1], 0.3);
      lerpedPos.z = THREE.Math.lerp(oldPos.z, newPos[2], 0.3);

      //Set the position
      clients[Object.keys(data.data._clientProps)[i]].mesh.position.set(lerpedPos.x, lerpedPos.y, lerpedPos.z);
    }
  }
//});
}
}