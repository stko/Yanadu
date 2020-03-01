#!/usr/bin/env python
# -*- coding: utf-8 -*-

class Room:
	''' provides all functions to load rooms
	'''
	
	@classmethod 
	def find_room_by_name( cls, user, room_name):
		room= cls.rooms["default"]
		if room==None:
			room=Room()
			cls.rooms["default"]=room
		print("room add user",repr(user))
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
	def onWebSocketOpen(cls,this_user):
		print("room: websocket opened")
		pass

	@classmethod 
	def onWebSocketClose(cls,this_user):
		# Delete this client from his room
		this_user.room.remove(this_user,True)
		print('User ' + this_user.peer_id + ' websocket closed, removed from room')

	def _user_enters_room(self, this_user):
		self.users.append(this_user)
		peer_ids=[]
		for user in self.users:
			peer_ids.append(user.peer_id)
		# Update everyone that the number of users has changed
		for user in self.users:
			if user != this_user:
				user.ws.emit('room_newUserConnected', {'id':this_user.peer_id, '_clientNum':len(self.users), '_ids': peer_ids})
		print('User {0} connected, there are {1} clients connected'.format( this_user.name, len(self.users)))
		this_user.ws.emit('room_introduction', {'id':this_user.peer_id, '_clientNum':len(self.users), '_ids': peer_ids})

	@classmethod 
	def handleWSMsg(cls, data, this_user):
		if data['type'] == 'room_remove':
			remove(data['config'],False)

		elif data['type'] == 'room_move':
			coordinates={}
			try:
				for any_user in this_user.room.users:
					if any_user.peer_id==this_user.peer_id:
						any_user.pos["position"]=data['config']['pos']
						any_user.pos["rotation"][1]=data['config']['angle']
					coordinates[any_user.peer_id]=any_user.pos
				for user in this_user.room.users:
					user.ws.emit('room_userPositions', {'coords':coordinates})
				this_user.room.check_user_for_group_attendance(this_user,2.0,4.0)
			except AttributeError:
				print("error on move")
				pass 

		else:
			print("Command not found:"+data['type'])

	def remove(self, this_user, user_died):
		'''removes a user out of its group, if there's any 
		'''
		for any_user in self.users:
			if any_user.peer_id!=this_user.peer_id:
				any_user.ws.emit('room_userDisconnected',{ 'id':this_user.peer_id })
		self.users.remove(this_user)

	def check_user_for_group_attendance(self, user,connect_distance, disconnect_distance):
		rtc = Room.parent.get_module("rtc_")
		if rtc:
			rtc_module=rtc["module"]
			group_1 = rtc_module.get_user_group(user)
			if group_1:
				''' the user is already in a group, so we need to check
				if he's still close enough to the other group members
				'''
				for other_user in group_1:
					if other_user != user:
						distance=user.get_user_distance(other_user)
						if distance <= disconnect_distance:
							print ("{0} is close enough to {1} ({2}), user can stay in his group".format(user.name,other_user.name,disconnect_distance))
							return
				''' no nearby users in the group anymore? 
				so we have to leave the group
				'''
				rtc_module.remove(user, False)
			else: # user is not in a group, so we search the next nearby other user
				for other_user in self.users:
					if other_user != user:
						distance=user.get_user_distance(other_user)
						print("distance:" , distance,connect_distance)
						if distance <= connect_distance:
							rtc_module.join_users_into_group(
								user, other_user)
							break


