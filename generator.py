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
# Let's define an object with message templates
tmpl = {}
tmpl['stat'] = {
	'status': None # Change this to reflect the current status
}

# Utility function that sends content to stdout
def stdoutSend( content ):
	sys.stdout.write( content )
	sys.stdout.flush()
# Returns the graphviz in exported format (as opposed to .DependencyGraph)
def exportGraphviz():
	stdoutSend( FreeCAD.ActiveDocument.exportGraphviz() )
# Returns the right metadata
def getContent():
	stdoutSend( FreeCAD.ActiveDocument.Content )
# Returns tessellation
def getTessellation( accuracy ):
	# TODO: Fuse all objects before tessellating
	try:
		stdoutSend( FreeCAD.ActiveDocument.getObject("Cut").Shape.tessellate( accuracy ).__str__() )
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
			setattr( fcobj, param, val ) # The goal of this function
			# If the above did not throw an error...
			msg = tmpl['stat']
			msg['status'] = 1 # Changed param success status
			stdoutSend( json.dumps(msg) )
		except AttributeError: # Uh oh, the object doesn't have the attribute!
			raise Warning("Object doesn't have the sought attribute")
	else: # Is raising a warning for this a good idea?
		raise Warning("Object doesn't exist in current document")

# Routes the command to the right function
def commandRouter( lineJson ):
	cmd = lineJson['command']
	opt = lineJson['options']
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
	# Route to right function
	# if not matched, throw error?

if __name__ == "__main__":
	import sys
	import json # For JSON parsing. Use json.load( fileobj ), not .loads( str )
	import time
	import FreeCAD # Prints init info to sys.stdout, can flush to return the data
	sys.stdout.flush()

	try:
		sys.argv[1] # First argument (sys.argv[0] is path)
	except IndexError:
		raise Warning("No filename passed in")

	try:
		DOCUMENT = FreeCAD.openDocument ( sys.argv[1] ) # Throws I/O Error
	except IOError:
		raise Warning("Invalid or non-existing file %s" % sys.argv[1])

	# Let parent process know we're up and running
	msg = tmpl['stat']
	msg['status'] = 0 # Use stat msg template. Status 0 is OK
	stdoutSend( json.dumps(msg) )
	# .flush() is necessary, stdout is a buffered file object. Sending '\n' doesn't work.

	while 1: # An infinite loop is fine, as the parent process can kill this one
		# sys.stdin.readline() happily blocks
		lineJson = json.loads( sys.stdin.readline() )
		# json.loads can throw an error
		if lineJson['type'] == 'command':
			commandRouter( lineJson )