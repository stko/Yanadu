
/**
 * webService namespace.
 */
if (typeof webService == "undefined") {
    webService = {

        /** CONFIG **/
        SIGNALING_SERVER: "wss://" + window.location.hostname + ":" + window.location.port,


        signaling_socket: null,   /* our socket.io connection to our webserver */
        modules:{}, /* contains the registered modules */
        register: function(prefix,wsMsghandler,wsOnOpen,wsOnClose){
            webService.modules[prefix]={'msg':wsMsghandler,'open':wsOnOpen,'close':wsOnOpen}
        },

        init: function () {
            console.log("Connecting to signaling server");
            webService.signaling_socket = new WebSocket(webService.SIGNALING_SERVER);
            webService.signaling_socket.onopen = function () {
                console.log("Connected to the signaling server");
                for (prefix in webService.modules){
                    webService.modules[prefix].open()
                }
            };

            webService.signaling_socket.onclose = function (event) {
                console.log("Disconnected from signaling server");
                for (prefix in webService.modules){
                    webService.modules[prefix].close()
                }
            };

            //when we got a message from a signaling server 
            webService.signaling_socket.onmessage = function (msg) {
                console.log("Got message", msg.data);
                var data = JSON.parse(msg.data);
                var success=false
                for (prefix in webService.modules){
                    if (data.type.startsWith(prefix)){
                        console.log("found module for msg type",data.type)
                        webService.modules[prefix].msg(data)
                        success=true
                        break
                    }
                }
                if (!success){
                    console.log("Error: Unknown ws message type ", data.type);
                }
            };

            webService.signaling_socket.onerror = function (err) {
                console.log("Got error", err);
            };


        },

        //alias for sending JSON encoded messages 
        emit: function (type, config) {
            //attach the other peer username to our messages 
            message = { 'type': type, 'config': config }

            webService.signaling_socket.send(JSON.stringify(message));
        },
    }
}