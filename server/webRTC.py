#!/usr/bin/env python
# -*- coding: utf-8 -*-import sys

import json
from base64 import b64encode


class WebRTC:

	def __init__(self, parent,ws_clients, global_config=None):
		self.parent = parent
		print("Reset webRTC groups...")
		self.groups = []
		self.ws_clients = ws_clients
		self.parent.register("rtc_", self, self.handleWSMsg,
						 self.onWebSocketOpen, self.onWebSocketClose)

	def get_user_group(self, user):
		for group in self.groups:
			if user in group:
				return group
		return None

	def get_user_by_peer_id(self, peer_id):
		for user in self.ws_clients:
			if user.peer_id == peer_id:
				return user
		return None

	def in_same_group(self, user_1, user_2):
		''' are both users are already in the same group?
		'''

		return False  # for testing: force a group join

	def add_user_to_group(self, user, group):
		group.append(user)
		for other_user in group:
			if other_user != user:
				other_user.ws.emit(
					'rtc_addPeer', {'peer_id': user.peer_id, 'should_create_offer': False})
				user.ws.emit(
					'rtc_addPeer', {'peer_id': other_user.peer_id, 'should_create_offer': True})

	def join_users_into_group(self, user_1, user_2):
		''' tries to bring two users together in a group

		does all the details:
		look if they are already in some groups etc.
		'''

		group_1 = self.get_user_group(user_1)
		group_2 = self.get_user_group(user_2)
		if not group_1 and not group_2:
			new_group = [user_1]
			self.groups.append(new_group)
			self.add_user_to_group(user_2, new_group)
		if group_1 and not group_2:
			self.add_user_to_group(user_2, group_1)
		if not group_1 and group_2:
			self.add_user_to_group(user_1, group_2)

	def onWebSocketOpen(self):
		pass

	def onWebSocketClose(self,user):
		self.remove(user,True)

	def handleWSMsg(self, data, user):
		if data['type'] == 'rtc_remove':
			remove(data['config'])

		elif data['type'] == 'rtc_relayICECandidate':
			peer_id = data['config']['peer_id']
			ice_candidate = data['config']['ice_candidate']
			#print("[" + user.peer_id + "] relaying ICE candidate to [" + peer_id + "] %s", ice_candidate)
			other_user = self.get_user_by_peer_id(peer_id)
			if other_user:
				other_user.ws.emit('rtc_iceCandidate', {
								   'peer_id': user.peer_id, 'ice_candidate': ice_candidate})
			else:
				print("Other user not found!",user,other_user,self.groups)

		elif data['type'] == 'rtc_relaySessionDescription':

			peer_id = data['config']['peer_id']
			session_description = data['config']['session_description']
			#print("[" + user.peer_id + "] relaying session description to [" + peer_id + "] %s", session_description)
			other_user = self.get_user_by_peer_id(peer_id)
			if other_user:
				other_user.ws.emit('rtc_sessionDescription', {
								   'peer_id': user.peer_id, 'session_description': session_description})

		else:
			print("Command not found:"+data['type'])

	def remove(self, user, user_died):
		'''removes a user out of its group, if there's any 
		'''

		print("[" + user.peer_id + "] remove ")
		group = self.get_user_group(user)
		if not group:
			return
		group.remove(user)
		if not user_died:
			for other_user in group:
				user.ws.emit('rtc_removePeer', {'peer_id': other_user.peer_id})
		for other_user in group:
			other_user.ws.emit('rtc_removePeer', {'peer_id': user.peer_id})
		if len(group) < 2:
			self.groups.remove(group)
