'''
credits:
combined http(s) and websocket server copied from
	https://github.com/PyOCL/httpwebsockethandler
	The MIT License (MIT)
	Copyright (c) 2015 Seven Watt

'''



import sys
import threading
import ssl
import json
from base64 import b64encode

VER = sys.version_info[0]
if VER >= 3:
	from socketserver import ThreadingMixIn
	from http.server import HTTPServer
	from io import StringIO
else:
	from SocketServer import ThreadingMixIn
	from BaseHTTPServer import HTTPServer
	from StringIO import StringIO

from HTTPWebSocketsHandler import HTTPWebSocketsHandler

if len(sys.argv) > 1:
	port = int(sys.argv[1])
else:
	port = 8000
if len(sys.argv) > 2:
	secure = str(sys.argv[2]).lower()=="secure"
else:
	secure = False
if len(sys.argv) > 3:
	credentials = str(sys.argv[3])
else:
	credentials = ""

users={}
channels={}
sockets={}

class User:
	'''handles all user related data
	'''
	def __init__(self,name,websocket):
		self.name=name
		self.ws=websocket
		self.pos={
			'position': [0, 0, 0],
			'rotation': [0, 0, 0]
		}

class WSXanaduHandler(HTTPWebSocketsHandler):
	
	def emit(self,type,config):
		message={'type':type, 'config':config}
		self.send_message(json.dumps(message))

	def part(self,channel):
		self.log_message("["+ self.name + "] part ")

		if not channel in self.channels:
			self.log_message("["+ self.name + "] ERROR: not in %s", channel)
			return

		del self.channels[channel]
		del channels[channel][self.name]

		for id in channels[channel]:
			channels[channel][id].emit('rtc_removePeer', {'peer_id': self.name})
			self.emit('rtc_removePeer', {'peer_id': id})


	def on_ws_message(self, message):
		global users
		if message is None:
			message = ''
		self.log_message('websocket received "%s"',str(message))
		try:
			data=json.loads(message)
		except:
			self.log_message('%s','Invalid JSON')
			return
		self.log_message('json msg: %s',message)

		if data['type'] =='msg':
			self.log_message('msg %s',data['data'])

		elif data['type'] =='rtc_join':
			channel = data['config']['channel']
			userdata = data['config']['userdata']
			self.name=data['config']['name']
			self.log_message("["+ self.name + "] join %s", data['config'])
			sockets[self.name] = self
			if channel in self.channels:
				self.log_message("["+ self.name + "] ERROR: already joined %s", channel)
				return
			if not channel in channels:
				channels[channel] = {}


			for id in channels[channel]:
				channels[channel][id].emit('rtc_addPeer', {'peer_id': self.name, 'should_create_offer': False})
				self.emit('rtc_addPeer', {'peer_id': id, 'should_create_offer': True})

			channels[channel][self.name] = self
			self.channels[channel] = channel

		elif data['type'] =='rtc_part':
			part(data['config'])
			self.log_message("ERROR: part command not implemented?!?")

		elif data['type'] =='rtc_relayICECandidate':
			peer_id = data['config']['peer_id']
			ice_candidate = data['config']['ice_candidate']
			self.log_message("["+ self.name + "] relaying ICE candidate to [" + peer_id + "] %s", ice_candidate)

			if peer_id in sockets:
				sockets[peer_id].emit('rtc_iceCandidate', {'peer_id': self.name, 'ice_candidate': ice_candidate})

		elif data['type'] =='rtc_relaySessionDescription':

			peer_id = data['config']['peer_id']
			session_description = data['config']['session_description']
			self.log_message("["+ self.name + "] relaying session description to [" + peer_id + "] %s", session_description)

			if peer_id in sockets:
				sockets[peer_id].emit('rtc_sessionDescription', {'peer_id': self.name, 'session_description': session_description})

		else:
			self.log_message("Command not found:"+data['type'])

	def on_ws_connected(self):
		self.log_message('%s','websocket connected')
		self.channels = {}



	def on_ws_closed(self):
		self.log_message('%s','websocket closed')
		# as we can't delete in an array while we iterate trough it, 
		# we make a temp copy first
		temp_copy=self.channels.copy()
		for channel in temp_copy:
			self.part(channel)
		self.log_message("["+ self.name+ "] disconnected")
		del sockets[self.name]
			

	def setup(self):
		super(HTTPWebSocketsHandler, self).setup()

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
	"""Handle requests in a separate thread."""

def _ws_main():
	try:
		server = ThreadedHTTPServer(('192.168.1.27', port), WSXanaduHandler)
		server.daemon_threads = True
		server.auth = b64encode(credentials.encode("ascii"))
		if secure:
			# double with line above?!?
			#server.auth = b64encode(credentials.encode("ascii"))
			server.socket = ssl.wrap_socket (server.socket, certfile='./server.pem',keyfile='./key.pem', server_side=True)
			print('started secure https server at port %d' % (port,))
		else:
			print('started http server at port %d' % (port,))
		server.serve_forever()
	except KeyboardInterrupt:
		print('^C received, shutting down server')
		server.socket.close()

if __name__ == '__main__':
	_ws_main()
