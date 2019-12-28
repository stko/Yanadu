from webRTC import WebRTC
from HTTPWebSocketsHandler import HTTPWebSocketsHandler
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
from room import Room


VER = sys.version_info[0]
if VER >= 3:
	from socketserver import ThreadingMixIn
	from http.server import HTTPServer
	from io import StringIO
else:
	from SocketServer import ThreadingMixIn
	from BaseHTTPServer import HTTPServer
	from StringIO import StringIO


if len(sys.argv) > 1:
	port = int(sys.argv[1])
else:
	port = 8000
if len(sys.argv) > 2:
	secure = str(sys.argv[2]).lower() == "secure"
else:
	secure = False
if len(sys.argv) > 3:
	credentials = str(sys.argv[3])
else:
	credentials = ""


class User:
	'''handles all user related data
	'''

	def __init__(self, name, peer_id, ws):
		self.name = name
		self.peer_id = peer_id
		self.ws = ws
		self.room = None
		self.pos = {
			'position': [0, 0, 0],
			'rotation': [0, 0, 0]
		}


modules = {}
ws_clients = []



class WSXanaduHandler(HTTPWebSocketsHandler):

	def get_module(self, prefix):
		global modules
		try:
			return modules[prefix]
		except:
			return None

	def emit(self, type, config):
		message = {'type': type, 'config': config}
		self.send_message(json.dumps(message))

	def on_ws_message(self, message):
		if message is None:
			message = ''
		self.log_message('websocket received "%s"', str(message))
		try:
			data = json.loads(message)
		except:
			self.log_message('%s', 'Invalid JSON')
			return
		self.log_message('json msg: %s', message)

		if data['type'] == 'msg':
			self.log_message('msg %s', data['data'])

		if data['type'] == '_join':
			self.log_message('join %s', data['config'])
			self.user.name = data['config']["name"]
			self.user.peer_id = data['config']["peer_id"]
			self.user.room = Room.find_room_by_name( None,self.user.peer_id, data['config']["room"])
			self.user.room.users.append(self.user)
			for other_user in self.user.room.users:
				if other_user != self.user:
					rtc = self.get_module("rtc_")
					if rtc:
						rtc["module"].join_users_into_group(
							self.user, other_user)
					break

		else:
			unknown_msg = True
			global modules
			for id, module in modules.items():
				if data['type'].lower().startswith(id):
					module["msg"](data, self.user)
					unknown_msg = False
			if unknown_msg:
				self.log_message("Command not found:"+data['type'])

	def on_ws_connected(self):
		self.log_message('%s', 'websocket connected')
		self.user = User("", None, self)
		global ws_clients
		ws_clients.append(self.user)

	def on_ws_closed(self):
		self.log_message('%s', 'websocket closed')
		# was that websocket already joined?
		try:
			self.user.peer_id
			rtc = self.get_module("rtc_")
			rtc["module"].remove(self.user, True)
			self.user.room.user_leaves(self.user)
		except:
			pass
		global ws_clients
		ws_clients.remove(self.user)

	def setup(self):
		super(HTTPWebSocketsHandler, self).setup()


class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
	"""Handle requests in a separate thread."""

	def register(self, prefix, module, wsMsghandler, wsOnOpen, wsOnClose):
		global modules
		modules[prefix] = {'module': module, 'msg': wsMsghandler,
						   'open': wsOnOpen, 'close': wsOnOpen}

	def open_Modules(self):
		global modules
		for module in modules.values():
			module["open"]()

	def close_Modules(self):
		global modules
		for module in modules.values():
			module["close"]()

def load_rooms(directory):
	print("load_rooms_not implemented yet")
	Room(None) # initialize a dummy room

def _ws_main():
	load_rooms(None)
	try:
		server = ThreadedHTTPServer(('192.168.1.27', port), WSXanaduHandler)
		server.daemon_threads = True
		server.auth = b64encode(credentials.encode("ascii"))
		if secure:
			# double with line above?!?
			#server.auth = b64encode(credentials.encode("ascii"))
			server.socket = ssl.wrap_socket(
				server.socket, certfile='./server.pem', keyfile='./key.pem', server_side=True)
			print('started secure https server at port %d' % (port,))
		else:
			print('started http server at port %d' % (port,))
		WebRTC(server, ws_clients)
		server.open_Modules()

		server.serve_forever()
	except KeyboardInterrupt:
		print('^C received, shutting down server')
		server.socket.close()


if __name__ == '__main__':
	_ws_main()
