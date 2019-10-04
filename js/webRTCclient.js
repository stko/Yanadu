// found on https://www.tutorialspoint.com/webrtc/webrtc_voice_demo.htm


//our username 
var name;
var connectedUsers=[];

//connecting to our signaling server 
var conn = new WebSocket('wss://192.168.1.27:8000');
//var conn = new WebSocket('wss://');

conn.onopen = function () {
   console.log("Connected to the signaling server");
};

//when we got a message from a signaling server 
conn.onmessage = function (msg) {
   console.log("Got message", msg.data);
   var data = JSON.parse(msg.data);

   switch (data.type) {
      case "login":
         handleLogin(data.success);
         break;
      //when somebody wants to call us 
      case "offer":
         handleOffer(data.offer, data.name);
         break;
      case "answer":
         handleAnswer(data.answer);
         break;
      //when a remote peer sends an ice candidate to us 
      case "candidate":
         handleCandidate(data.candidate);
         break;
      case "leave":
         handleLeave();
         break;
      default:
         break;
   }
};

conn.onerror = function (err) {
   console.log("Got error", err);
};

//alias for sending JSON encoded messages 
function send(message,connectedUser) {
   //attach the other peer username to our messages 
   if (connectedUser) {
      message.name = connectedUser;
   }

   conn.send(JSON.stringify(message));
};

//****** 
//UI selectors block 
//****** 

var loginPage = document.querySelector('#loginPage');
var usernameInput = document.querySelector('#usernameInput');
var loginBtn = document.querySelector('#loginBtn');

var callPage = document.querySelector('#callPage');
var callToUsernameInput = document.querySelector('#callToUsernameInput');
var callBtn = document.querySelector('#callBtn');

var hangUpBtn = document.querySelector('#hangUpBtn');
var localAudio = document.querySelector('#localAudio');
var remoteAudio = document.querySelector('#remoteAudio');

var yourConn;
var stream;

callPage.style.display = "none";

// Login when the user clicks the button 
loginBtn.addEventListener("click", function (event) {
   name = usernameInput.value;

   if (name.length > 0) {
      send({
         type: "login",
         name: name
      });
   }

});

 var streamHandler = function (myStream) {
   stream = myStream;

   //displaying local audio stream on the page 
   //depricated!: localAudio.src = window.URL.createObjectURL(stream);
   // see https://stackoverflow.com/a/53821674
   localAudio.srcObject=stream;


   //using Google public stun server 
   var configuration = {
      "iceServers": [{ "url": "stun:stun2.1.google.com:19302" }]
   };

   yourConn = new webkitRTCPeerConnection(configuration);

   // setup stream listening 
   yourConn.addStream(stream);

   //when a remote user adds stream to the peer connection, we display it 
   yourConn.onaddstream = function (e) {
  //depricated!: remoteAudio.src = window.URL.createObjectURL(e.stream);
   // see https://stackoverflow.com/a/53821674
   remoteAudio.srcObject=e.stream;
   };

   // Setup ice handling 
   yourConn.onicecandidate = function (event) {
      if (event.candidate) {
         send({
            type: "candidate",
            candidate: event.candidate
         });
      }
   };

};
var errorHandler = function (error) {
   console.log(error);
};

async function getMedia(constraints) {
   let stream = null;
 
   try {
     stream = await navigator.mediaDevices.getUserMedia(constraints);
     /* use the stream */
     streamHandler(stream)
   } catch(err) {
     /* handle the error */
     errorHandler(err)
   }
 }


function handleLogin(success) {
   if (success === false) {
      alert("Ooops...try a different username");
   } else {
      loginPage.style.display = "none";
      callPage.style.display = "block";
      getMedia({ audio: true});
   }
}
// ---------------------------------




//initiating a call 
callBtn.addEventListener("click", function () {
   var callToUsername = callToUsernameInput.value;

   if (callToUsername.length > 0) {
      connectedUsers[callToUsername] = {



         'name':callToUsername,
         'yourConn':{
            'onicecandidate' : null,
            'onaddstream' : null
         },
         // create an offer 
         createOffer: function (
            function (offer) {
         send({
            type: "offer",
            offer: offer
         });

         yourConn.setLocalDescription(offer);
      }, function (error) {
         alert("Error when creating an offer");
      });

      };


      // create an offer 
      yourConn.createOffer(function (offer) {
         send({
            type: "offer",
            offer: offer
         });

         yourConn.setLocalDescription(offer);
      }, function (error) {
         alert("Error when creating an offer");
      });
   }
});


//when somebody sends us an offer 
function handleOffer(offer, name) {
   connectedUser = name;
   yourConn.setRemoteDescription(new RTCSessionDescription(offer));

   //create an answer to an offer 
   yourConn.createAnswer(function (answer) {
      yourConn.setLocalDescription(answer);

      send({
         type: "answer",
         answer: answer
      });

   }, function (error) {
      alert("Error when creating an answer");
   });

};

//when we got an answer from a remote user 
function handleAnswer(answer) {
   yourConn.setRemoteDescription(new RTCSessionDescription(answer));
};

//when we got an ice candidate from a remote user 
function handleCandidate(candidate) {
   yourConn.addIceCandidate(new RTCIceCandidate(candidate));
};

//hang up
hangUpBtn.addEventListener("click", function () {
   send({
      type: "leave"
   });

   handleLeave();
});

function handleLeave() {
   connectedUser = null;
   remoteAudio.src = null;

   yourConn.close();
   yourConn.onicecandidate = null;
   yourConn.onaddstream = null;
};
