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
	
	def send_json(self,msg):
		self.send_message(json.dumps(msg))

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

		elif data['type'] =='login':
			self.log_message('User logged in %s',data['name'])
			# if anyone is logged in with this username then refuse
			if data['name'] in users:
				self.send_json({"type": "login", "success": False })
			else:
				users[data['name']] = User(data['name'],self)
				self.name=data['name']
				self.send_json({"type": "login", "success": True })

		elif data['type'] =='offer':
			# for ex. UserA wants to call UserB 
			self.log_message('"Sending offer to: %s',data['name'])
			# if UserB exists then send him offer details 
			try:
				conn=users[data['name']].ws
				#setting that UserA connected with UserB 
				self.otherName=data['name']
				conn.send_json({"type": "offer", "offer": data['offer'], "name": self.name})
			except:
				pass

		elif data['type'] =='answer':
			# for ex. UserB answers UserA 
			self.log_message('"Sending answer to: %s',data['name'])
			# if UserB exists then send him offer details 
			try:
				conn=users[data['name']].ws
				self.otherName=data['name']
				conn.send_json({"type": "answer", "answer": data['answer']})
			except:
				pass

		elif data['type'] =='candidate':
			# for ex. UserB answers UserA 
			self.log_message('"Sending candidate to: %s',data['name'])
			# if UserB exists then send him offer details 
			try:
				conn=users[data['name']].ws
				conn.send_json({"type": "candidate", "candidate": data['candidate']})
			except:
				pass
		elif data['type'] =='leave':
			# if UserB exists then send him offer details 
			try:
				self.log_message('"Disconnecting from %s',data['name'])
				conn=users[data['name']].ws
				del conn.otherName 
				conn.send_json({"type": "leave"})
			except:
				pass
		else:
			self.send_json({"type": "error", "message": "Command not found:"+data['type']})

	def on_ws_connected(self):
		self.log_message('%s','websocket connected')

	def on_ws_closed(self):
		self.log_message('%s','websocket closed')
		try: # is self.name defined?
			del users[self.name]
			try: # is self.othername defined
				self.log_message('Disconnecting from %s',self.otherName)
				conn=users[self.otherName]
				del conn.otherName
				conn.send_json({"type": "leave"})
			except:
				pass
		except:
			pass
			

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
