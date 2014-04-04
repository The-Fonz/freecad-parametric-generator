"""
	This script contains all code required to run the standalone FreeCAD 'generator'.
	It communicates with the parent process using stdin, stdout and stderr.
	Message passing is done using JSON objects. The structure is as follows:
	## Incoming message (command) ##
	{
		type: command, # command is the only type for now
		command: returnMetadata | returnTessellation
		options: {
			tolerance: .1 # Required if command === returnTessellation
		}
	}
	## Outgoing message (reply) ##
	{
		status: 0 | # Optional, 0=OK
	}
"""

# Imports
import sys
import json # For JSON parsing. Use json.load( fileobj ), not .loads( str )
import time
import FreeCAD # Prints init info to sys.stdout, can flush to return the data
sys.stdout.flush() # Flush FreeCAD's init info

# Let's define a message object for easy handling, and to avoid deep copy issues
class Msg:
	# Constructor with no arguments means just initializing
	def __init__(self, type=None, data=None):
		self.msg = {
			'type': type, # Change this to reflect the current type
			'data': data
		}
	# Convert python object to json and send it on stdout
	def stdoutDump(self):
		# Write to stdout in json format
		sys.stdout.write( json.dumps(self.msg) )
		# .flush() is necessary, stdout is a buffered file object. Sending '\n' doesn't work.
		sys.stdout.flush()

# Returns the graphviz in exported format (as opposed to .DependencyGraph)
def exportGraphviz():
	data = FreeCAD.ActiveDocument.exportGraphviz()
	msg = Msg('exportGraphviz', data )
	msg.stdoutDump()

# Returns the right metadata
def getContent():
	msg = Msg()
	msg.msg['type'] = 'getContent'
	msg.msg['data'] = FreeCAD.ActiveDocument.Content
	msg.stdoutDump()

# Returns tessellation
def getTessellation( accuracy ):
	# TODO: Fuse all objects before tessellating
	try:
		data = FreeCAD.ActiveDocument.getObject("Cut").Shape.tessellate( accuracy ).__str__()
		msg = Msg('getTessellation', data)
		msg.stdoutDump()
	except TypeError:
		raise Warning("Accuracy parameter is of the wrong type")

# Changes parameter
def changeParam( objName, param, val ):
	fcobj = FreeCAD.ActiveDocument.getObject( objName )
	try: # Test if val is a number
		val = float(val)
	except ValueError:
		# Is it wise to raise so many warnings?
		raise Warning("Can't cast value to float")
	if fcobj: # If object exist in current document
		try:
			# Builtin python function to set obj param per object name string
			setattr( fcobj, param, val ) # The goal of this entire function
			# If the above did not throw an error...
			msg = Msg('changeParam') # Only set type, no data needed
			msg.stdoutDump()
		except AttributeError: # Uh oh, the object doesn't have the attribute!
			raise Warning("Object doesn't have the sought attribute")
	else: # Is raising a warning for this a good idea?
		raise Warning("Object doesn't exist in current document")

# Routes the command to the right function
def commandRouter( lineJson ):
	cmd = lineJson['command'] # Easy access
	opt = lineJson['options'] # Easy access
	# Make `case`-like functionality with if/elif checks
	if cmd == "getContent":
		getContent()
	elif cmd == "exportGraphviz":
		exportGraphviz()
	elif cmd == "getTessellation":
		acc = opt['accuracy'] # Throws KeyError
		getTessellation( acc )
	elif cmd == "changeParam":
		objName = opt['objName']
		param = opt['param']
		val = opt['val']
		changeParam( objName, param, val )
	else:
		# if not matched, throw error? 
		pass

if __name__ == "__main__":
	try:
		sys.argv[1] # First argument (sys.argv[0] is path)
	except IndexError:
		raise Warning("No filename passed in")

	try:
		DOCUMENT = FreeCAD.openDocument ( sys.argv[1] ) # Throws I/O Error
	except IOError:
		raise Warning("Invalid or non-existing file %s" % sys.argv[1])

	# Let parent process know we're up and running
	Msg('init').stdoutDump() # Init message. No status needed, with this we always say 'we're running'

	# Main loop. Using an infinite loop is fine, as the parent process can kill this one.
	while 1:
		# sys.stdin.readline() happily blocks
		lineJson = json.loads( sys.stdin.readline() ) # json.loads can throw an error

		if lineJson['type'] == 'command':
			commandRouter( lineJson )