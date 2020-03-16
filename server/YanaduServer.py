#!/usr/bin/env python
# -*- coding: utf-8 -*-

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
import os
import threading
import ssl
import json
from base64 import b64encode
import math
from room import Room
from uuid import uuid4
import argparse
import yaml

from pprint import pprint

VER = sys.version_info[0]
if VER >= 3:
	from socketserver import ThreadingMixIn
	from http.server import HTTPServer
	from io import StringIO
else:
	from SocketServer import ThreadingMixIn
	from BaseHTTPServer import HTTPServer
	from StringIO import StringIO

try:
	with open(r'config.yaml') as file:
		# The FullLoader parameter handles the conversion from YAML
		# scalar values to Python the dictionary format
		global_config = yaml.load(file, Loader=yaml.Loader)
except:
	global_config={
		'host': 'localhost',
		'port': 8000,
		'secure': True,
		'credentials': '',
		'rooms':{
			'default' : 'no_idea..'
		}
	}



parser = argparse.ArgumentParser()
parser.add_argument("--host", default=global_config["host"],
                    help="the IP interface to bound the server to")
parser.add_argument("-p", "--port", default=global_config["port"],
                    help="the server port")
parser.add_argument("-s", "--secure", action="store_true", default=global_config["secure"],
                    help="use secure https: and wss:")
parser.add_argument("-c", "--credentials",  default=global_config["credentials"],
                    help="user credentials")
args = parser.parse_args()
print(repr(args))



class User:
	'''handles all user related data
	'''


	def __init__(self, name, ws):
		self.name = name
		self.peer_id =  str(uuid4())
		self.ws = ws
		self.room = None
		self.pos = {
			'position': [0, 0, 0],
			'rotation': [0, 0, 0]
		}
	
	def	get_user_distance(self, other_user):
		return math.sqrt((other_user.pos["position"][0] - self.pos["position"][0])**2 + (other_user.pos["position"][1] - self.pos["position"][1])**2 + (other_user.pos["position"][2] - self.pos["position"][2])**2)



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
			data = json.loads(str(message.decode('ascii')))
		except:
			self.log_message('Invalid JSON: %s', message)
			return
		#self.log_message('json msg: %s', message)

		if data['type'] == 'msg':
			self.log_message('msg %s', data['data'])

		if data['type'] == '_join':
			self.log_message('join %s', data['config'])
			self.user.name = data['config']["name"]
			#self.user.peer_id = data['config']["peer_id"]
			self.user.room = Room.find_room_by_name( self.user, data['config']["room"])
			'''
			rtc = self.get_module("rtc_")
			if rtc:
				for other_user in self.user.room.users:
					if other_user != self.user:
							rtc["module"].join_users_into_group(
								self.user, other_user)
					break
			'''
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
		self.user = User("", self)
		global ws_clients
		ws_clients.append(self.user)
		global modules
		for module in modules.values():
			module["onWebSocketOpen"](self.user)


	def on_ws_closed(self):
		self.log_message('%s', 'websocket closed')
		global ws_clients
		ws_clients.remove(self.user)
		global modules
		#for module in modules.values():
		for module_name, module in modules.items():
			module["onWebSocketClose"](self.user)

	def setup(self):
		super(HTTPWebSocketsHandler, self).setup()


class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
	"""Handle requests in a separate thread."""

	def register(self, prefix, module, wsMsghandler, wsOnOpen, wsOnClose):
		global modules
		modules[prefix] = {'module': module, 'msg': wsMsghandler,
						   'onWebSocketOpen': wsOnOpen, 'onWebSocketClose': wsOnClose}

	def get_module(self, prefix):
		global modules
		try:
			return modules[prefix]
		except:
			return None



def _ws_main():
	try:
		server = ThreadedHTTPServer((args.host, args.port), WSXanaduHandler)
		server.daemon_threads = True
		server.auth = b64encode(args.credentials.encode("ascii"))
		if args.secure:
			# double with line above?!?
			#server.auth = b64encode(args.credentials.encode("ascii"))
			server.socket = ssl.wrap_socket(
				server.socket, certfile='./server.pem', keyfile='./key.pem', server_side=True)
			print('started secure https server at port %d' % (args.port))
		else:
			print('started http server at port %d' % (args.port))
		WebRTC(server, ws_clients, global_config)
		Room.init(server, global_config)
		origin_dir = os.path.dirname(__file__)
		web_dir = os.path.join(os.path.dirname(__file__), '../public')
		os.chdir(web_dir)

		server.serve_forever()
		os.chdir(origin_dir)
	except KeyboardInterrupt:
		print('^C received, shutting down server')
		server.socket.close()


if __name__ == '__main__':
	_ws_main()
