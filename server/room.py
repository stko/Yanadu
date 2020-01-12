#!/usr/bin/env python
# -*- coding: utf-8 -*-

class Room:
	''' provides all functions to load rooms
	'''

	def __init__(self, parent, ws_clients, global_config):
		self.parent = parent
		print("init rooms")
		self.rooms=[]
		self.global_config = global_config
		self.ws_clients = ws_clients
		self.parent.register("room_", self, self.handleWSMsg,
			self.onWebSocketOpen, self.onWebSocketClose)

	def onWebSocketOpen(self,user):
		pass

	def onWebSocketClose(self,user):

		# Delete this client from the object
		for any_user in self.ws_clients:
			if any_user.peer_id!=user.peer_id:
				any_user.ws.emit('room_userDisconnected',{'clientCount': len(self.ws_clients), '_id':user.peer_id, })
		print('User ' + user.peer_id + ' dissconeted, there are ' + len(self.ws_clients) + ' clients connected')

	def user_enters_room(self, user):
		peer_ids=[]
		for user in self.ws_clients:
			peer_ids.append(user.peer_id)
		print('User {0} connected, there are {1} clients connected'.format( user.name, len(self.ws_clients)))
		user.ws.emit('room_introduction', {'id':user.peer_id, '_clientNum':len(self.ws_clients), '_ids': peer_ids})
		# Update everyone that the number of users has changed
		for user in self.ws_clients:
			user.ws.emit('room_newUserConnected', {'id':user.peer_id, '_clientNum':len(self.ws_clients), '_ids': peer_ids})

	def handleWSMsg(self, data, user):
		if data['type'] == 'room_remove':
			remove(data['config'])

		elif data['type'] == 'room_move':
			coordinates={}
			for any_user in self.ws_clients:
				if any_user.peer_id==user.peer_id:
					any_user.pos=data['config']['pos']
				coordinates[any_user.peer_id]=any_user.pos
			for user in self.ws_clients:
				user.ws.emit('room_move', {'coords':coordinates})

		else:
			print("Command not found:"+data['type'])

	def remove(self, user, user_died):
		'''removes a user out of its group, if there's any 
		'''
		pass