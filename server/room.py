#!/usr/bin/env python
# -*- coding: utf-8 -*-

class SingleRoom:
	pass

class Room:
	''' provides all functions to load rooms
	'''
	
	@classmethod 
	def find_room_by_name( cls, user, room_name):
		room= cls.rooms["default"]
		if room==None:
			room=Room()
			cls.rooms["default"]=room
		room._user_enters_room(user)
		return room



	@classmethod 
	def init(cls, parent, global_config):
		cls.parent = parent
		cls.rooms={"default":None}
		print("init rooms")
		cls.global_config = global_config
		cls.parent.register("room_", cls, cls.handleWSMsg,
			cls.onWebSocketOpen, cls.onWebSocketClose)

	def __init__(self):
		print("init single rooms")
		self.users = []

	@classmethod 
	def onWebSocketOpen(cls,user):
		pass

	@classmethod 
	def onWebSocketClose(cls,user):

		# Delete this client from the object
		for any_user in user.users:
			if any_user.peer_id!=user.peer_id:
				any_user.ws.emit('room_userDisconnected',{'clientCount': len(self.users), '_id':user.peer_id, })
		print('User ' + user.peer_id + ' disconnected, there are ' + len(self.users) + ' clients connected')

	def _user_enters_room(self, user):
		peer_ids=[]
		for user in self.users:
			peer_ids.append(user.peer_id)
		print('User {0} connected, there are {1} clients connected'.format( user.name, len(self.users)))
		user.ws.emit('room_introduction', {'id':user.peer_id, '_clientNum':len(self.users), '_ids': peer_ids})
		# Update everyone that the number of users has changed
		for user in self.users:
			user.ws.emit('room_newUserConnected', {'id':user.peer_id, '_clientNum':len(self.users), '_ids': peer_ids})
		self.users.append(user)


	@classmethod 
	def handleWSMsg(self, data, user):
		if data['type'] == 'room_remove':
			remove(data['config'])

		elif data['type'] == 'room_move':
			coordinates={}
			try:
				for any_user in user.room.users:
					if any_user.peer_id==user.peer_id:
						any_user.pos=data['config']['pos']
					coordinates[any_user.peer_id]=any_user.pos
				for user in user.room.users:
					user.ws.emit('room_move', {'coords':coordinates})
			except AttributeError:
				pass 

		else:
			print("Command not found:"+data['type'])

	def remove(self, user, user_died):
		'''removes a user out of its group, if there's any 
		'''
		pass