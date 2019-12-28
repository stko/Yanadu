class Room:
	''' provides all functions to load rooms
	'''
	rooms=[]
	def __init__(self,filename):
		self.name='default'
		self.users=[]
		Room.rooms.append(self)

	def find_room_by_name(self, user_name, room_name):
		''' try to finds the room the user wants to enter at join

		first it's tried to find the matching room name.

		If not found, we check if the user belongs to any room
		(his home) and we return that room

		if this also fails, we place him in the lobby :-)

		'''
		print("find_room_by_name not implemented yet")
		return Room.rooms[0]
	
	def user_leaves(self,user):
		self.users.remove(user)
